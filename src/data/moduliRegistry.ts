import type React from 'react'
import type { Misura } from '../types'
import type { SubtitleBuilder } from './cardSubtitles'
import { subtitleRumore, subtitleWbv, subtitleHav, subtitleMicroclima, subtitleCem, subtitleRoa, subtitlePolveri, subtitleCarbonio, subtitleGas, subtitleBiologico, subtitleAcqua, subtitleIpa, subtitleAmianto, subtitleMmc, subtitleOwas, subtitleOcra } from './cardSubtitles'
import MisuraRumoreModal from '../components/MisuraRumoreModal'
import MisuraWbvModal from '../components/MisuraWbvModal'
import MisuraHavModal from '../components/MisuraHavModal'
import MisuraMicroclimaModal from '../components/MisuraMicroclimaModal'
import MisuraCemModal from '../components/MisuraCemModal'
import MisuraRoaModal from '../components/MisuraRoaModal'
import MisuraPolveriModal from '../components/MisuraPolveriModal'
import MisuraCarbonioModal from '../components/MisuraCarbonioModal'
import MisuraGasModal from '../components/MisuraGasModal'
import MisuraBiologicoModal from '../components/MisuraBiologicoModal'
import MisuraAcquaModal from '../components/MisuraAcquaModal'
import MisuraIpaModal from '../components/MisuraIpaModal'
import MisuraAmiantoModal from '../components/MisuraAmiantoModal'
import MisuraMmcModal from '../components/MisuraMmcModal'
import MisuraOwasModal from '../components/MisuraOwasModal'
import MisuraOcraModal from '../components/MisuraOcraModal'

export interface MisuraModalCommonProps {
  open: boolean
  onClose: () => void
  onSaved: (misura: Misura) => void
  cantiereId: string
  campagnaId: string
  misuraDaModificare?: Misura | null
}

export type MisuraModalComponent = React.ComponentType<MisuraModalCommonProps>

export interface ModuloRegistryEntry {
  modalComponent: MisuraModalComponent
  subtitleBuilder: SubtitleBuilder
}

export const MODULI_REGISTRY: Record<string, ModuloRegistryEntry> = {
  'rumore': {
    modalComponent: MisuraRumoreModal,
    subtitleBuilder: subtitleRumore,
  },
  'vibrazioni-wbv': {
    modalComponent: MisuraWbvModal,
    subtitleBuilder: subtitleWbv,
  },
  'vibrazioni-hav': {
    modalComponent: MisuraHavModal,
    subtitleBuilder: subtitleHav,
  },
  'microclima': {
    modalComponent: MisuraMicroclimaModal,
    subtitleBuilder: subtitleMicroclima,
  },
  'cem': {
    modalComponent: MisuraCemModal,
    subtitleBuilder: subtitleCem,
  },
  'roa': {
    modalComponent: MisuraRoaModal,
    subtitleBuilder: subtitleRoa,
  },
  'polveri': {
    modalComponent: MisuraPolveriModal,
    subtitleBuilder: subtitlePolveri,
  },
  'carbonio-elementare': {
    modalComponent: MisuraCarbonioModal,
    subtitleBuilder: subtitleCarbonio,
  },
  'gas': {
    modalComponent: MisuraGasModal,
    subtitleBuilder: subtitleGas,
  },
  'biologico-sas': {
    modalComponent: MisuraBiologicoModal,
    subtitleBuilder: subtitleBiologico,
  },
  'acqua': {
    modalComponent: MisuraAcquaModal,
    subtitleBuilder: subtitleAcqua,
  },
  'ipa': {
    modalComponent: MisuraIpaModal,
    subtitleBuilder: subtitleIpa,
  },
  'amianto': {
    modalComponent: MisuraAmiantoModal,
    subtitleBuilder: subtitleAmianto,
  },
  'mmc': {
    modalComponent: MisuraMmcModal,
    subtitleBuilder: subtitleMmc,
  },
  'owas': {
    modalComponent: MisuraOwasModal,
    subtitleBuilder: subtitleOwas,
  },
  'ocra': {
    modalComponent: MisuraOcraModal,
    subtitleBuilder: subtitleOcra,
  },
}

export function getModuloEntry(moduloId: string | undefined): ModuloRegistryEntry | undefined {
  if (!moduloId) return undefined
  return MODULI_REGISTRY[moduloId]
}
