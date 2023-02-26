import L from 'leaflet';
import './Map.css';

import {
  MapContainer,
  TileLayer,
  Polygon,
  useMapEvent,
  Marker,
} from 'react-leaflet';
import geohash from 'ngeohash';

import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';

const RESOLUTION = 5;
const FPS = 5;

const PolygonWithText = ({
  positions,
  text,
}: {
  positions: [number, number][];
  text: string;
}) => {
  const center = L.polygon(positions).getBounds().getCenter();
  const textElement = L.divIcon({
    html: text,
    className: 'text-icon',
    iconSize: [0, 0],
  });
  // only display text if polygon is large enoth

  return (
    <Polygon color="gray" positions={positions}>
      <Marker position={center} icon={textElement} />
    </Polygon>
  );
};

const GeoHash = ({ hash }: { hash: string }) => {
  const [minLat, minLng, maxLat, maxLng] = geohash.decode_bbox(hash);
  return (
    <PolygonWithText
      positions={[
        [minLat, minLng],
        [minLat, maxLng],
        [maxLat, maxLng],
        [maxLat, minLng],
      ]}
      text={hash}
    />
  );
};

const GeoHashes = ({
  resolution = 2,
  hashes,
  addHash,
  clickable,
}: {
  resolution?: number;
  hashes: string[];
  addHash: (hash: string) => void;
  clickable: boolean;
}) => {
  useMapEvent('click', (e) => {
    if (!clickable) return;
    const { lat, lng } = e.latlng;
    const hash = geohash.encode(lat, lng, resolution);
    addHash(hash);
  });

  return (
    <>
      {hashes.map((hash) => (
        <GeoHash key={hash} hash={hash} />
      ))}
    </>
  );
};

const golStep = (hashes: string[]) => {
  const newHashes: string[] = [];

  const addHash = (hash: string) => {
    if (!newHashes.includes(hash)) {
      newHashes.push(hash);
    }
  };

  hashes.forEach((hash) => {
    const neighbors = geohash.neighbors(hash);
    const neighborHashes = Object.values(neighbors);
    const neighborCount = neighborHashes.reduce(
      (count, neighborHash) =>
        hashes.includes(neighborHash) ? count + 1 : count,
      0
    );
    if (neighborCount === 2 || neighborCount === 3) {
      addHash(hash);
    }
    neighborHashes.forEach((neighborHash) => {
      const neighborNeighbors = geohash.neighbors(neighborHash);
      const neighborNeighborHashes = Object.values(neighborNeighbors);
      const neighborNeighborCount = neighborNeighborHashes.reduce(
        (count, neighborNeighborHash) =>
          hashes.includes(neighborNeighborHash) ? count + 1 : count,
        0
      );

      if (neighborNeighborCount === 3) {
        addHash(neighborHash);
      }

      // const neighborNeighborHashes = Object.values(neighborNeighbors);
      // const neighborNeighborCount = neighborNeighborHashes.reduce(
    });
  });

  return newHashes;
};

const Map = () => {
  const [selectedHashes, setSelectedHashes] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playedFrames, setPlayedFrames] = useState(0);

  const addHash = (hash: string) =>
    // remove hash if it is already selected
    setSelectedHashes((selectedHashes) =>
      selectedHashes.includes(hash)
        ? selectedHashes.filter((selectedHash) => selectedHash !== hash)
        : [...selectedHashes, hash]
    );

  // game main loop
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setSelectedHashes((selectedHashes) => {
        const nextStep = golStep(selectedHashes);
        // if same hashes pause
        if (
          nextStep.length === selectedHashes.length &&
          nextStep.every(function (value, index) {
            return value === selectedHashes[index];
          })
        ) {
          setIsPlaying(false);
        }
        return nextStep;
      });
      setPlayedFrames((playedFrames) => playedFrames + 1);
    }, 1000 / FPS);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <>
      <MapContainer
        center={[48.196, 16.357]}
        zoom={13}
        minZoom={1}
        maxBounds={[
          [-90, -180],
          [90, 180],
        ]}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          noWrap={true}
        />
        <GeoHashes
          resolution={RESOLUTION}
          hashes={selectedHashes}
          addHash={addHash}
          clickable={!playedFrames}
        />
      </MapContainer>
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          padding: 5,
          backgroundColor: 'white',
          display: 'flex',
          flexDirection: 'row',
          placeItems: 'center',
          gap: 10,
          border: '1px solid black',
          borderRadius: 5,
        }}
      >
        <button onClick={() => setIsPlaying((isPlaying) => !isPlaying)}>
          {isPlaying ? 'Pause' : 'Start'}
        </button>
        {!!playedFrames && (
          <button
            onClick={() => {
              setIsPlaying(false);
              setSelectedHashes([]);
              setPlayedFrames(0);
            }}
          >
            Reset
          </button>
        )}
        {!!playedFrames && <div>Played frames: {playedFrames}</div>}
        {!!playedFrames && <div>Cells alive: {selectedHashes.length}</div>}
      </div>
    </>
  );
};

export default Map;
