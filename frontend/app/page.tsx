import dynamic from 'next/dynamic'

const MapContainer = dynamic(
    () => import('@/components/map-container'),
    { 
        ssr: false,
        loading: () => (
            <div className="w-full h-[600px] flex items-center justify-center">
                <p>Loading map...</p>
            </div>
        )
    }
)

export default function Home() {
    return (
        <main className="w-full">
            <div className="flex flex-col items-center">
                <h1 className="font-semibold my-4">
                    Select a Dentist Location
                </h1>
            </div>
            <MapContainer />
        </main>
    )
}
