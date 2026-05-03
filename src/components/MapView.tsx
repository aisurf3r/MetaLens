import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ImageFile } from "@/types/image";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    // Ensure tiles render correctly after mount/resize (critical on mobile)
    const t = setTimeout(() => {
      try { map.invalidateSize(); } catch {}
      if (positions.length === 0) return;
      if (positions.length === 1) {
        map.setView(positions[0], 13);
      } else {
        map.fitBounds(positions, { padding: [40, 40] });
      }
    }, 100);
    return () => clearTimeout(t);
  }, [positions, map]);
  return null;
}

function ZoomMarker({ img, onSelect, children }: { img: ImageFile; onSelect: (id: string) => void; children: React.ReactNode }) {
  const map = useMap();
  return (
    <Marker
      position={[img.gps!.latitude, img.gps!.longitude]}
      eventHandlers={{
        click: () => {
          onSelect(img.id);
          map.flyTo([img.gps!.latitude, img.gps!.longitude], 16, { duration: 0.8 });
        },
      }}
    >
      {children}
    </Marker>
  );
}

interface Props {
  images: ImageFile[];
  onSelect: (id: string) => void;
}

export default function MapView({ images, onSelect }: Props) {
  const gpsImages = images.filter((img) => {
    const lat = img.gps?.latitude;
    const lon = img.gps?.longitude;
    return (
      typeof lat === "number" && typeof lon === "number" &&
      Number.isFinite(lat) && Number.isFinite(lon) &&
      lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180
    );
  });

  if (gpsImages.length === 0) {
    return (
      <div className="glass-card p-8 flex flex-col items-center justify-center text-center min-h-[250px]">
        <MapPin className="w-10 h-10 text-muted-foreground/40 mb-3" />
        <p className="text-muted-foreground text-sm">No GPS data found in uploaded images</p>
        <p className="text-muted-foreground/60 text-xs mt-1">Upload photos with location data to see them on the map</p>
      </div>
    );
  }

  const positions: [number, number][] = gpsImages.map((img) => [img.gps!.latitude, img.gps!.longitude]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card overflow-hidden rounded-xl"
    >
      <MapContainer
        center={positions[0]}
        zoom={13}
        className="w-full h-[300px] md:h-[400px]"
        scrollWheelZoom
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Street">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite">
            <TileLayer
              attribution='Tiles &copy; Esri'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        <FitBounds positions={positions} />
        {gpsImages.map((img) => (
          <ZoomMarker
            key={img.id}
            img={img}
            onSelect={onSelect}
          >
            <Popup>
              <div className="flex items-center gap-2">
                <img src={img.url} alt={img.name} className="w-12 h-12 rounded object-cover" />
                <div>
                  <p className="text-xs font-medium">{img.name}</p>
                  <p className="text-[10px] opacity-70">
                    {img.gps!.latitude.toFixed(4)}, {img.gps!.longitude.toFixed(4)}
                  </p>
                </div>
              </div>
            </Popup>
          </ZoomMarker>
        ))}
      </MapContainer>
    </motion.div>
  );
}
