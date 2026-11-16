export type ResultadoValidacion =
  | { tipo: 'AUTORIZADO'; codigo: string; estado: string }
  | {
      tipo: 'RECHAZADO';
      codigo: string;
      causa: 'ENTRADA_UTILIZADA' | 'ENTRADA_NO_EXISTE' | 'NO_AUTORIZADO';
      mensaje: string;
    }
  | { tipo: 'ERROR'; codigo: string; mensaje: string };
