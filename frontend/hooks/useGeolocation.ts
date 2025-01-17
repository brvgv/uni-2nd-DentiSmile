import { useState, useEffect } from 'react'

const DEFAULT_POSITION: [number, number] = [60, 12]

export function useGeolocation() {
    const [position, setPosition] = useState<[number, number]>(DEFAULT_POSITION)
    const [zoom, setZoom] = useState<number>(8)

    useEffect(() => {
        if (typeof window === 'undefined') return

        try {
            const savedPosition = window.sessionStorage.getItem('userPosition')

            if (savedPosition) {
                const [lat, lng] = JSON.parse(savedPosition)
                setPosition([lat, lng])
                setZoom(15)
                return
            }

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        const newPosition: [number, number] = [
                            pos.coords.latitude,
                            pos.coords.longitude
                        ]
                        setPosition(newPosition)
                        setZoom(15)
                        window.sessionStorage.setItem(
                            'userPosition',
                            JSON.stringify(newPosition)
                        )
                    },
                    () => {
                        setPosition(DEFAULT_POSITION)
                    }
                )
            }
        } catch (error) {
            console.error('Error getting user position:', error)
            setPosition(DEFAULT_POSITION)
        }
    }, [])

    return { position, zoom }
}
