'use client'

import Link from 'next/link'
import { User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useNotification } from '@/hooks/useNotification'
import { useEffect, useState } from 'react'

export default function AccountButton() {
    const [patientId, setPatientId] = useState<string>()
    const router = useRouter()
    useNotification(patientId ?? undefined)

    useEffect(() => {
        const patientId = localStorage.getItem('patientId')
        if (patientId) setPatientId(patientId)
    }, [])

    const handleAccountClick = (e: React.MouseEvent) => {
        e.preventDefault()
        const token = localStorage.getItem('authToken')
        router.push(token ? '/account' : '/register')
    }

    return (
        <Link
            href="/account"
            onClick={handleAccountClick}
            className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center"
        >
            <User size={24} />
        </Link>
    )
}
