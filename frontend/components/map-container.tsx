'use client'

import { MapContainer as LeafletMapContainer, useMap } from 'react-leaflet'
import { useEffect } from 'react'
import 'leaflet/dist/leaflet.css'
import { MapTile } from './MapTile'

type LatLngTuple = [number, number]

interface MapContainerProps {
    children: React.ReactNode
    center: LatLngTuple
    zoom: number
}

const MapUpdater = ({
    center,
    zoom
}: {
    center: LatLngTuple
    zoom: number
}) => {
    const map = useMap()

    useEffect(() => {
        map.setView(center, zoom, {
            animate: true,
            duration: 1
        })
    }, [center, zoom, map])

    return null
}

const MapContainer = ({ children, center, zoom }: MapContainerProps) => {
    const swedishBounds: [LatLngTuple, LatLngTuple] = [
        [55.02652, 10.54138], // Southwest corner
        [69.06643, 24.22472] // Northeast corner
    ]

    return (
        <LeafletMapContainer
            center={center}
            zoom={zoom}
            scrollWheelZoom={true}
            style={{ height: '90vh', zIndex: 1 }}
            maxBounds={swedishBounds}
            minZoom={8}
            boundsOptions={{ padding: [50, 50] }}
            attributionControl={false}
        >
            <MapUpdater center={center} zoom={zoom} />
            <MapTile />
            {children}
        </LeafletMapContainer>
    )
}

export default MapContainer
