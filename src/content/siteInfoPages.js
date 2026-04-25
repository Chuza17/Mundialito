export const SITE_INFO_LINKS = [
  { slug: 'contacto', label: 'Contacto', to: '/legal/contacto' },
  { slug: 'terminos', label: 'Terminos', to: '/legal/terminos' },
  { slug: 'puntos', label: 'Sistema de puntos', to: '/legal/puntos' },
  { slug: 'reglas', label: 'Reglas', to: '/legal/reglas' },
  { slug: 'copyright', label: 'Copyright', to: '/legal/copyright' },
]

export const SITE_INFO_PAGES = {
  contacto: {
    kicker: 'Contacto',
    title: 'Informacion del creador',
    description: 'Canal oficial para dudas, soporte general y comentarios sobre la quiniela.',
    sections: [
      {
        title: 'Datos principales',
        paragraphs: [
          'Creador: Gabriel Campos Mora.',
          'Correo oficial de contacto: Gabri200017@gmail.com.',
        ],
      },
      {
        title: 'Alcance del contacto',
        bullets: [
          'Consultas sobre funcionamiento general de la plataforma.',
          'Reportes de errores visuales, de navegacion o de carga.',
          'Dudas sobre cierres, reglas visibles y experiencia del usuario.',
        ],
      },
    ],
  },
  terminos: {
    kicker: 'Terminos',
    title: 'Terminos y condiciones',
    description: 'Condiciones basicas de uso para participar dentro de El Mundialito.',
    sections: [
      {
        title: 'Aceptacion de uso',
        paragraphs: [
          'Al utilizar la plataforma, el jugador acepta las fechas de cierre, reglas activas y criterios visibles dentro de cada modulo.',
          'El uso de la quiniela implica revisar la informacion antes de confirmar predicciones o guardar avances.',
        ],
      },
      {
        title: 'Responsabilidad del usuario',
        bullets: [
          'Verificar que sus selecciones sean correctas antes de guardar.',
          'Respetar cierres de grupos, mejores terceros, eliminatorias y resultados.',
          'Entender que una prediccion bloqueada no se puede editar despues del cierre.',
        ],
      },
    ],
  },
  puntos: {
    kicker: 'Puntaje',
    title: 'Sistema de puntos',
    description: 'Resumen general de como se evalua la quiniela segun las reglas visibles del torneo.',
    sections: [
      {
        title: 'Resultados',
        bullets: [
          'Cada marcador exacto acertado en la seccion de resultados suma 2 puntos extra.',
          'La prediccion debe guardarse antes de que cierre el partido para poder contar.',
        ],
      },
      {
        title: 'Fases del torneo',
        paragraphs: [
          'Los grupos, mejores terceros y eliminatorias se califican con base en la configuracion oficial activa del torneo.',
          'El scoreboard refleja los puntos ya procesados por el sistema y recalculados cuando corresponde.',
        ],
      },
    ],
  },
  reglas: {
    kicker: 'Reglas',
    title: 'Reglas claras de participacion',
    description: 'Normas simples para que todos jueguen bajo el mismo criterio dentro de la plataforma.',
    sections: [
      {
        title: 'Guardado y bloqueos',
        bullets: [
          'Las predicciones guardadas quedan sujetas al cierre oficial de su partido o fase.',
          'Cuando una seleccion se bloquea, deja de estar disponible para editarse.',
          'Las acciones del admin pueden recalcular o sincronizar informacion oficial del torneo.',
        ],
      },
      {
        title: 'Interpretacion del torneo',
        paragraphs: [
          'La plataforma toma como referencia la configuracion interna del torneo y los datos oficiales cargados en el sistema.',
          'Si algun dato no carga correctamente, el sistema puede mostrar respaldos o estados temporales mientras se corrige.',
        ],
      },
    ],
  },
  copyright: {
    kicker: 'Copyright',
    title: 'Uso de recursos y propiedad intelectual',
    description: 'Aclaracion sobre los elementos visuales, nombres y materiales usados dentro del sitio.',
    sections: [
      {
        title: 'Titularidad',
        paragraphs: [
          'Los nombres, escudos, banderas, imagenes, videos, marcas y otros elementos pertenecen a sus respectivos autores y titulares.',
          'El sitio no reclama propiedad sobre recursos de terceros usados para ambientacion, contexto deportivo o visualizacion.',
        ],
      },
      {
        title: 'Uso permitido en la plataforma',
        paragraphs: [
          'Los elementos se presentan con fines informativos, recreativos y de experiencia de usuario dentro de la quiniela.',
          'No fueron utilizados con fines de plagio, suplantacion o apropiacion indebida de propiedad intelectual.',
        ],
      },
    ],
  },
}

export function getSiteInfoPage(slug = '') {
  if (SITE_INFO_PAGES[slug]) {
    return SITE_INFO_PAGES[slug]
  }

  return {
    kicker: 'Legal',
    title: 'Informacion no encontrada',
    description: `No existe una pagina legal registrada para "${slug}".`,
    sections: [
      {
        title: 'Que puedes hacer',
        paragraphs: ['Vuelve al footer y abre una de las paginas disponibles para revisar la informacion correcta.'],
      },
    ],
  }
}
