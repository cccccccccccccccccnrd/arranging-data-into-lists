export interface Video {
  title: string
  description: string
  url: string
  videoId: string
  seconds: number
  timestamp: string
  views: number
  genre: string
  uploadDate: string
  ago: string
  image: string
  thumbnail: string
  author: {
    name: string
    url: string
  }
  meta: {
    q: string
    timestamp: number
  }
  duration?: object
}
