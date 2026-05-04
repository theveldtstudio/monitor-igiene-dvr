import sys
import openpyxl
from openpyxl.styles import Alignment

TEMPLATE_PATH = "public/templates/wbv.xlsx"
SHEET_NAME = "CI"

MERGES_TO_ADD = [
    "B1:C1",
    "F1:J1",
    "A3:A4",
    "B3:B4",
    "C3:C4",
    "D3:D4",
    "E3:E4",
    "F3:F4",
    "G3:G4",
    "H3:H4",
    "I3:I4",
    "J3:J4",
    "K3:M3",
    "N3:N4",
    "O3:O4",
    "P3:P4",
    "Q3:Q4",
]

# Only vertical merges (row 3:4) need alignment fix — K3:M3 is horizontal, skip it
VERTICAL_HEADER_MERGES = [
    "A3:A4", "B3:B4", "C3:C4", "D3:D4", "E3:E4", "F3:F4",
    "G3:G4", "H3:H4", "I3:I4", "J3:J4", "N3:N4", "O3:O4",
    "P3:P4", "Q3:Q4",
]

COL_N_WIDTH = 12


def parse_merge_ref(ref):
    """Return frozenset of (min_row, min_col, max_row, max_col) from merge ref string."""
    from openpyxl.utils import range_boundaries
    return range_boundaries(ref)  # (min_col, min_row, max_col, max_row)


def main():
    print(f"Opening {TEMPLATE_PATH} ...")
    wb = openpyxl.load_workbook(TEMPLATE_PATH)

    if SHEET_NAME not in wb.sheetnames:
        print(f"ERROR: sheet '{SHEET_NAME}' not found. Sheets: {wb.sheetnames}")
        sys.exit(1)

    ws = wb[SHEET_NAME]

    # Build existing merge map: ref_string -> boundaries
    existing_merges = {}
    for mr in ws.merged_cells.ranges:
        existing_merges[str(mr)] = (mr.min_col, mr.min_row, mr.max_col, mr.max_row)

    print(f"Existing merges before changes: {list(existing_merges.keys())}")

    for ref in MERGES_TO_ADD:
        from openpyxl.utils import range_boundaries
        want = range_boundaries(ref)  # (min_col, min_row, max_col, max_row)

        if ref in existing_merges:
            print(f"  SKIP (already present): {ref}")
            continue

        # Check conflict: any existing merge whose range overlaps with 'ref'
        conflict = None
        for ex_ref, ex_bounds in existing_merges.items():
            ex_min_col, ex_min_row, ex_max_col, ex_max_row = ex_bounds
            w_min_col, w_min_row, w_max_col, w_max_row = want
            # Overlap if ranges intersect
            if (w_min_col <= ex_max_col and w_max_col >= ex_min_col and
                    w_min_row <= ex_max_row and w_max_row >= ex_min_row):
                conflict = ex_ref
                break

        if conflict:
            print(f"ERROR: {ref} conflicts with existing merge {conflict}. Aborting.")
            sys.exit(1)

        ws.merge_cells(ref)
        existing_merges[ref] = want
        print(f"  ADDED: {ref}")

    # Fix alignment for vertical header merges (only alignment, nothing else)
    for ref in VERTICAL_HEADER_MERGES:
        from openpyxl.utils import coordinate_to_tuple
        # Master cell is top-left of range
        top_left = ref.split(":")[0]
        row, col = coordinate_to_tuple(top_left)
        cell = ws.cell(row=row, column=col)
        # Copy existing alignment, only override vertical and wrap
        existing = cell.alignment
        cell.alignment = Alignment(
            horizontal=existing.horizontal,
            vertical="center",
            wrap_text=True,
            text_rotation=existing.textRotation,
            indent=existing.indent,
            shrink_to_fit=existing.shrinkToFit,
        )

    # Set column N width
    ws.column_dimensions["N"].width = COL_N_WIDTH
    print(f"  SET column N width = {COL_N_WIDTH}")

    wb.save(TEMPLATE_PATH)
    print(f"\nSaved {TEMPLATE_PATH}")


if __name__ == "__main__":
    main()
