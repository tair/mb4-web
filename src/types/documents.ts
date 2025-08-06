export interface Document {
  document_id: number
  folder_id?: number
  access: number
  published: number
  uploaded_on: number
  title: string
  description: string
  file_name?: string
  mime_type?: string
  size?: number
  download_url?: string
}

export interface DocumentFolder {
  folder_id: number
  title: string
  description: string
  access: number
}

export interface S3Warning {
  message: string
  failed_s3_deletions?: Array<{
    s3Key: string
    error: string
  }>
}

export interface DocumentApiResponse {
  success: boolean
  error?: string
  warnings?: S3Warning
}

export interface DocumentCreateResponse extends DocumentApiResponse {
  document?: Document
}

export interface DocumentDeleteResponse extends DocumentApiResponse {
  document_ids?: number[]
}

export interface FolderDeleteResponse extends DocumentApiResponse {
  folder_id?: number
}