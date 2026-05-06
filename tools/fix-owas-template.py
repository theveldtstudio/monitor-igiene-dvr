"""
Fix public/templates/owas.xlsx — due bug strutturali.

BUG 1: celle D-J nelle righe dati 5-12 condividono lo stesso xf record.
       ExcelJS quando scrive numFmt su D (hh:mm:ss) sovrascrive l'xf
       condiviso contaminando E-I. Fix: assegna numFmt distinti per gruppo
       cosi' openpyxl crea xf records separati.

BUG 2 (verifica): B1 (committente) controllato per merge. Se standalone
       nessuna azione. Se dentro merge viene sciolto.
"""
import sys
import shutil
import openpyxl
from openpyxl.utils import range_boundaries

TEMPLATE_PATH = "public/templates/owas.xlsx"
BACKUP_PATH   = "public/templates/owas.xlsx.bak"

DATA_ROWS    = range(5, 13)   # righe 5-12 incluse
COL_DURATA   = 4              # D
COL_CODICI   = [5, 6, 7, 8, 9]  # E,F,G,H,I
COL_TESTO    = [2, 3, 10]    # B,C,J

NUM_FMT_DURATA = '[hh]:mm:ss'  # diverso da runtime 'hh:mm:ss' -> ExcelJS crea nuovo xf per D
NUM_FMT_INT    = '0'
NUM_FMT_TEXT   = 'General'


def is_cell_in_merge(ws, row, col):
    """True se la cella (row,col) e' dentro un merge range (anche non-master)."""
    for mr in ws.merged_cells.ranges:
        if mr.min_row <= row <= mr.max_row and mr.min_col <= col <= mr.max_col:
            return str(mr)
    return None


def main():
    print(f"Backup: {TEMPLATE_PATH} -> {BACKUP_PATH}")
    shutil.copy(TEMPLATE_PATH, BACKUP_PATH)
    print("  OK")

    print(f"\nOpening {TEMPLATE_PATH} ...")
    wb = openpyxl.load_workbook(TEMPLATE_PATH)
    ws = wb.active

    # ── FIX BUG 2: verifica merge su B1 ──────────────────────────────────────
    print("\n=== FIX BUG 2 — B1 merge check ===")
    b1_merge = is_cell_in_merge(ws, row=1, col=2)
    if b1_merge:
        print(f"  B1 e' dentro merge {b1_merge}")
        # Scioglie solo se coinvolge B1 (non A1 solitario)
        # In pratica qualsiasi merge che contenga B1 va sciolto
        ws.unmerge_cells(b1_merge)
        print(f"  UNMERGED: {b1_merge}")
    else:
        print("  B1 standalone — nessuna azione necessaria")

    # ── FIX BUG 1: numFmt distinti per gruppo nelle righe dati 5-12 ──────────
    print("\n=== FIX BUG 1 — numFmt distinti righe dati ===")
    changes = 0
    for r in DATA_ROWS:
        # D: durata
        cell_d = ws.cell(row=r, column=COL_DURATA)
        cell_d.number_format = NUM_FMT_DURATA
        changes += 1

        # E-I: codici interi OWAS
        for c in COL_CODICI:
            ws.cell(row=r, column=c).number_format = NUM_FMT_INT
            changes += 1

        # B,C,J: testo libero (esplicito per forzare xf separato da D/E-I)
        for c in COL_TESTO:
            ws.cell(row=r, column=c).number_format = NUM_FMT_TEXT
            changes += 1

    print(f"  Applicate numFmt su {changes} celle ({len(list(DATA_ROWS))} righe x 9 colonne)")
    print(f"  D5:D12  -> '{NUM_FMT_DURATA}'")
    print(f"  E5:I12  -> '{NUM_FMT_INT}'")
    print(f"  B5,C5,J5..J12 -> '{NUM_FMT_TEXT}'")

    # ── Salva ─────────────────────────────────────────────────────────────────
    wb.save(TEMPLATE_PATH)
    print(f"\nOK Template salvato: {TEMPLATE_PATH}")
    print(f"OK Backup disponibile: {BACKUP_PATH}")


if __name__ == "__main__":
    main()
