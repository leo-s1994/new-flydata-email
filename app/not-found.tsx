import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <p className="mt-4 text-xl text-gray-600">页面未找到</p>
        <Link
          href="/compose"
          className="mt-6 inline-block py-2 px-6 border border-transparent rounded-lg shadow-sm text-white bg-primary hover:bg-primary/90 transition-colors"
        >
          返回首页
        </Link>
      </div>
    </div>
  )
}
