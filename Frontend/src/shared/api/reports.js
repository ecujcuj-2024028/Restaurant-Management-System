import api from './api'

const REPORTS_ENDPOINT = '/reports'

const getNombreArchivoDesdeHeaders = (headers, nombrePorDefecto) => {
  const contentDisposition = headers?.['content-disposition']

  if (!contentDisposition) return nombrePorDefecto

  const coincidencia = contentDisposition.match(/filename="?([^"]+)"?/)

  return coincidencia?.[1] || nombrePorDefecto
}

const descargarArchivo = (blob, nombreArchivo) => {
  const urlArchivo = window.URL.createObjectURL(blob)
  const enlaceDescarga = document.createElement('a')

  enlaceDescarga.href = urlArchivo
  enlaceDescarga.download = nombreArchivo
  document.body.appendChild(enlaceDescarga)
  enlaceDescarga.click()
  enlaceDescarga.remove()

  window.URL.revokeObjectURL(urlArchivo)
}

export const getReportsData = (params = {}) => {
  return api.get(`${REPORTS_ENDPOINT}/data`, { params })
}

export const exportReportsPdf = async (params = {}) => {
  const response = await api.get(`${REPORTS_ENDPOINT}/pdf`, {
    params,
    responseType: 'blob',
  })

  const nombreArchivo = getNombreArchivoDesdeHeaders(
    response.headers,
    `reporte-gastromanager-${Date.now()}.pdf`
  )

  descargarArchivo(response.data, nombreArchivo)

  return response
}

export const exportReportsExcel = async (params = {}) => {
  const response = await api.get(`${REPORTS_ENDPOINT}/excel`, {
    params,
    responseType: 'blob',
  })

  const nombreArchivo = getNombreArchivoDesdeHeaders(
    response.headers,
    `reporte-gastromanager-${Date.now()}.xlsx`
  )

  descargarArchivo(response.data, nombreArchivo)

  return response
}