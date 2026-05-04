import sys
import openpyxl
from openpyxl import load_workbook
from openpyxl.styles import Alignment
from openpyxl.utils import coordinate_to_tuple

SOURCE_PATH = "tools/templates-source/owas-source.xlsm"
OUTPUT_PATH = "public/templates/owas.xlsx"

MERGES_FINAL = [
    "E1:H1",   # Cantiere value space
    "A2:J2",   # OWAS title
    "A3:A4",   # REG vertical
    "B3:B4",   # MANSIONE vertical
    "C3:C4",   # ATTIVITA' vertical
    "D3:D4",   # DURATA vertical
    "E3:I3",   # CODICE OWAS horizontal
    "J3:J4",   # NOTE vertical
    "A16:B16", # Tecnico rilevatore label
    "C16:J16", # Tecnico rilevatore value
]

VERTICAL_HEADER_MERGES = [
    "A3:A4", "B3:B4", "C3:C4", "D3:D4", "J3:J4",
]

COL_WIDTHS = {
    "A": 6,
    "B": 22,
    "C": 25,
    "D": 12,
    "E": 10,
    "F": 10,
    "G": 10,
    "H": 10,
    "I": 10,
    "J": 30,
}

CELL_TEXTS = {
    "A1": "Impresa:",
    "C1": "Data:",
    "D1": "Cantiere:",
    "I1": "Pag: 1",
    "A2": "OWAS (Titolo VI D.Lgs 81/08)",
    "A3": "REG\n[n°]",
    "B3": "MANSIONE",
    "C3": "ATTIVITA'",
    "D3": "DURATA",
    "E3": "CODICE OWAS",
    "J3": "NOTE",
    "E4": "SCHIENA",
    "F4": "BRACCIA",
    "G4": "GAMBE",
    "H4": "CARICO",
    "I4": "CLASSE",
    "A16": "Tecnico rilevatore:",
}


def main():
    print(f"Opening {SOURCE_PATH} ...")
    wb = load_workbook(SOURCE_PATH, keep_vba=False)

    print(f"Sheets found: {wb.sheetnames}")
    ws = wb.active
    print(f"Using sheet: {ws.title}")
    print(f"Dimensions before: {ws.dimensions}  max_col={ws.max_column}  max_row={ws.max_row}")

    # Step 1: unmerge ALL existing ranges
    existing_merges = list(ws.merged_cells.ranges)
    print(f"\nUnmerging {len(existing_merges)} existing merge ranges...")
    for mr in existing_merges:
        ws.unmerge_cells(str(mr))
    print("  Done — all unmerged.")

    # Step 2: delete col E (MACCHINE) then E again (NO2, now shifted to E)
    print("\nDeleting 2 columns at position 5 (E=MACCHINE, F=NO2)...")
    ws.delete_cols(5, 2)
    print(f"  Done. max_col now = {ws.max_column}")

    # Step 3: delete rows 17-33 (second page)
    print("\nDeleting rows 17-33 (second page)...")
    ws.delete_rows(17, 17)
    print(f"  Done. max_row now = {ws.max_row}")

    # Step 4: apply final merges
    print("\nApplying final merges...")
    for ref in MERGES_FINAL:
        ws.merge_cells(ref)
        print(f"  MERGED: {ref}")

    # Step 5: set column widths
    print("\nSetting column widths...")
    for col_letter, width in COL_WIDTHS.items():
        ws.column_dimensions[col_letter].width = width
        print(f"  {col_letter}: {width}")

    # Step 6: write cell texts
    print("\nSetting cell texts...")
    for cell_ref, text in CELL_TEXTS.items():
        ws[cell_ref] = text
        print(f"  {cell_ref} = {repr(text)}")

    # Step 7: verify/set progressive numbers A5:A13
    print("\nVerifying progressive numbers A5:A13...")
    for i, row in enumerate(range(5, 14), start=1):
        current = ws.cell(row=row, column=1).value
        if current != i:
            ws.cell(row=row, column=1).value = i
            print(f"  A{row}: set to {i} (was {repr(current)})")
        else:
            print(f"  A{row}: already {i}")

    # Step 8: alignment on vertical header merges
    print("\nSetting alignment on vertical header merges...")
    for ref in VERTICAL_HEADER_MERGES:
        top_left = ref.split(":")[0]
        row, col = coordinate_to_tuple(top_left)
        ws.cell(row=row, column=col).alignment = Alignment(
            horizontal="center",
            vertical="center",
            wrap_text=True,
        )
        print(f"  {top_left}: center/center/wrap")

    # Step 8b: alignment for other header cells
    for cell_ref in ["E3", "E4", "F4", "G4", "H4", "I4", "J3"]:
        ws[cell_ref].alignment = Alignment(
            horizontal="center",
            vertical="center",
            wrap_text=True,
        )
    print("  E3, E4-I4, J3: center/center/wrap")

    # Step 9: save as xlsx (no vba)
    wb.save(OUTPUT_PATH)
    print(f"\nSaved: {OUTPUT_PATH}")
    print("Done.")


if __name__ == "__main__":
    main()
