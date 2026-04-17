'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Halaman checkout sudah digabung ke /cart
// Redirect otomatis ke cart
export default function CheckoutPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/cart')
  }, [router])
  return null
}