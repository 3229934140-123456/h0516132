export const formatCurrency = (amount: number, currency: string = 'CNY'): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export const formatDate = (date: string | Date, format: 'full' | 'date' | 'month' = 'full'): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '-'

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }

  if (format === 'full') {
    options.hour = '2-digit'
    options.minute = '2-digit'
  } else if (format === 'month') {
    delete options.day
  }

  return new Intl.DateTimeFormat('zh-CN', options).format(d)
}

export const formatRelativeTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '-'

  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000)

  if (diffInSeconds < 60) return '刚刚'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} 分钟前`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} 小时前`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} 天前`
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} 个月前`
  return `${Math.floor(diffInSeconds / 31536000)} 年前`
}

export const contractStatusText: Record<string, string> = {
  pending: '待签署',
  active: '进行中',
  completed: '已完成',
  cancelled: '已取消',
}

export const projectStatusText: Record<string, string> = {
  planning: '规划中',
  in_progress: '进行中',
  completed: '已完成',
  on_hold: '已暂停',
}

export const paymentStatusText: Record<string, string> = {
  pending: '待支付',
  paid: '已支付',
  overdue: '已逾期',
  refunded: '已退款',
}

export const getContractStatusText = (status: string): string => {
  return contractStatusText[status] || status
}

export const getProjectStatusText = (status: string): string => {
  return projectStatusText[status] || status
}

export const getPaymentStatusText = (status: string): string => {
  return paymentStatusText[status] || status
}

export const calculatePercentage = (part: number, total: number): number => {
  if (total === 0) return 0
  return Math.round((part / total) * 100)
}

export const formatPercentage = (part: number, total: number): string => {
  return `${calculatePercentage(part, total)}%`
}

export const formatNumber = (num: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
}

export const formatLargeNumber = (num: number): string => {
  if (Math.abs(num) >= 100000000) {
    return `${(num / 100000000).toFixed(1)} 亿`
  }
  if (Math.abs(num) >= 10000) {
    return `${(num / 10000).toFixed(1)} 万`
  }
  return formatNumber(num)
}

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

export interface CSVHeader<T> {
  key: keyof T | string
  label: string
}

export const exportToCSV = <T>(
  data: T[],
  headers: CSVHeader<T>[],
  filename: string,
): void => {
  const escapeCSV = (value: unknown): string => {
    if (value === null || value === undefined) return ''
    const str = String(value)
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const headerRow = headers.map((h) => escapeCSV(h.label)).join(',')
  const dataRows = data.map((row) =>
    headers.map((h) => {
      const key = h.key as keyof T
      return escapeCSV(row[key])
    }).join(','),
  )
  const csvContent = [headerRow, ...dataRows].join('\r\n')

  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })

  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
