import React, { useEffect, useMemo, useState, useRef } from "react";
import mapboxgl from "mapbox-gl";
import axios from "axios";
import Image from "next/image";

const ClusterMap = () => {
  const [rooms, setRooms] = useState([]);
  const [roomsGeoJSON, setRoomsGeoJSON] = useState();
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [visibleRooms, setVisibleRooms] = useState([]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(2000);
  const [rideauxChecked, setRideauxChecked] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [typeSalle, setTypeSalle] = useState([]);
  const [map, setMap] = useState();

  useEffect(() => {
    axios
      .get('http://localhost:4000/salles')
      .then((response) => {
        const types = [];

        response.data.forEach((salle) => {
          const salleType = salle.type_salle;
          
          if (salleType && !types.includes(salleType)) {
            types.push(salleType);
          }
        });
        setTypeSalle(types);
        const geocodePromises = response.data.map((salle) => {

          const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            salle.address
          )}.json?access_token=${apiKey}`;
          return axios.get(url);
        });

        axios
          .all(geocodePromises)
          .then((responses) => {
            const updatedRooms = response.data.map((salle, index) => {
              const features = responses[index].data.features;
              const coordinates = features.length > 0 ? features[0].center : [0, 0];
              return {
                ...salle,
                longitude: coordinates[0],
                latitude: coordinates[1],
              };
            });
            setRooms(updatedRooms);
          })
          .catch((error) => {
            console.error(error);
          });
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  const apiKey = useMemo(
    () =>
      "pk.eyJ1Ijoia2VzdTE5MjAwMSIsImEiOiJjbGY4NDBmN3gxbDl2M3NvY2I0a2x1cjV5In0.e32XCdbmKqmZ3jOoN2f0SA",
    []
  );

  const roomsGeoJSONRef = useRef();

  useEffect(() => {
    const roomsGeoJSON = {
      type: 'FeatureCollection',
      features: rooms
        .filter((room) => room.prix <= maxPrice && (rideauxChecked ? room.rideaux : true) && (selectedType ? room.type_salle === selectedType : true)) // Filtre des salles en fonction du prix
        .map((room) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [room.longitude, room.latitude],
          },
          properties: {
            name: room.nom,
            address: room.address,
            image: room.image,
          },
        })),
    };
    setRoomsGeoJSON(roomsGeoJSON);
    roomsGeoJSONRef.current = roomsGeoJSON; // Mise à jour de la référence mutable
  }, [rooms, minPrice, maxPrice, rideauxChecked, selectedType]);

  useEffect(() => {
    mapboxgl.accessToken = apiKey;

    const map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/streets-v12",
      center: [2.333333, 48.866667],
      zoom: 12,
    });
    setMap(map)
    map.on("load", () => {
      if (roomsGeoJSONRef.current) {
        map.addSource("roomsGeoJSON", {
          type: "geojson",
          data: roomsGeoJSONRef.current, // Utilisation de la référence mutable
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50,
        });
        const pinImage = window.location.origin + '/pin.png';

        map.loadImage(pinImage, (error, image) => {
          if (error) throw error;
          map.addImage('pin', image);
        });
        map.addLayer({
          id: "clusters",
          type: "circle",
          source: "roomsGeoJSON",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": [
              "step",
              ["get", "point_count"],
              "#51bbd6",
              100,
              "#f1f075",
              750,
              "#f28cb1",
            ],
            "circle-radius": [
              "step",
              ["get", "point_count"],
              20,
              100,
              30,
              750,
              40,
            ],
          },
        });

        map.addLayer({
          id: "cluster-count",
          type: "symbol",
          source: "roomsGeoJSON",
          filter: ["has", "point_count"],
          layout: {
            "text-field": ["get", "point_count_abbreviated"],
            "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
            "text-size": 12,
          },
        });

        map.addLayer({
          id: 'unclustered-point',
          type: 'symbol',
          source: 'roomsGeoJSON',
          filter: ['!', ['has', 'point_count']],
          layout: {
            'icon-image': 'pin', // Utilisation de l'image personnalisée pour le marqueur
            'icon-size': 0.2, // Ajustez la taille du marqueur selon vos besoins
            'icon-allow-overlap': true, // Permet aux marqueurs de se chevaucher
          },
        });

        map.on("click", "clusters", (e) => {
          const features = map.queryRenderedFeatures(e.point, {
            layers: ["clusters"],
          });
          const clusterId = features[0].properties.cluster_id;
          map
            .getSource("roomsGeoJSON")
            .getClusterExpansionZoom(clusterId, (err, zoom) => {
              if (err) return;

              map.easeTo({
                center: features[0].geometry.coordinates,
                zoom: zoom,
              });
            });
        });

        map.on('click', 'unclustered-point', (e) => {
          const coordinates = e.features[0].geometry.coordinates.slice();
          const room = e.features[0].properties;

          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
          }

          const popup = new mapboxgl.Popup()
            .setLngLat(mapboxgl.LngLat.convert(coordinates))
            .setHTML(
              `<div class="popup-container">
                <h1>${room.name}</h1>
                <p>${room.address}</p>
                <img src="${room.image}" />
                <p class="bouton-reserver-container">
                  <a href="${room.link}" class="bouton-reserver">Réserver</a>
                </p>
              </div>`
            )
            .addTo(map);
        });

        map.on("mouseenter", "clusters", () => {
          map.getCanvas().style.cursor = "pointer";
        });

        map.on("mouseleave", "clusters", () => {
          map.getCanvas().style.cursor = "";
        });
      }
      
    }

    );

    const handleMapMove = () => {
      // Filtrer les salles visibles en fonction des coordonnées de la carte
      const bounds = map.getBounds();
      const filteredRooms = rooms.filter((r) =>
        bounds.contains([r.longitude, r.latitude])
      );
      setVisibleRooms(filteredRooms);
    };

    map.on("moveend", handleMapMove);

    // Nettoyage de l'effet
    return () => {
      map.off("moveend", handleMapMove);
      map.remove();
    };

  }, [apiKey, roomsGeoJSON]);

  // Fonction pour gérer la sélection d'une salle
  const handleRoomSelect = (room) => {
    // Mettre à jour la salle sélectionnée
    setSelectedRoom(room);
    
    // Filtrer les salles visibles en fonction des coordonnées de la carte
    map.easeTo({
      center: [room.longitude, room.latitude],
      zoom: 17, // Adjust the zoom level as needed
    })
  };

  return (
    <div>
      <div>
        <label>Prix maximum:</label>
        <input
          type="number"
          value={maxPrice}
          onChange={(e) => setMaxPrice(parseFloat(e.target.value))}
          min={0}
          max={2000}
          style={{ marginRight: '10px' }}
        />

        <label>Type de salle:</label>
        <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} style={{ marginRight: '10px' }}>
          <option value="">Tous les types</option>
          {typeSalle.map((type, index) => (
            <option key={index} value={type}>{type}</option>
          ))}
        </select>

        <label htmlFor="rideaux">Rideaux:</label>
        <input
          type="checkbox"
          checked={rideauxChecked}
          onChange={(e) => setRideauxChecked(e.target.checked)}
        />

      </div>

      <div style={{ display: "flex" }}>

        <div className="side-menu-map">
          <h2>Rooms</h2>
          <ul>
            {visibleRooms.map((room) => (
              <li
                key={room.id}
                style={{
                  fontWeight: selectedRoom === room ? "bold" : "normal",
                }}
                onClick={() => handleRoomSelect(room)}
              >
                <div className="list-item">
                  <div>
                    <p>{room.nom}</p>
                    <p>{room.address}</p>
                  </div>
                  <div>
                    <Image
                      alt="image de la salle"
                      src={room.image}
                      width={100}
                      height={100}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="map-container">
          <div
            id="map"
            style={{
              position: "absolute",
              top: 50,
              bottom: 0,
              right: 50,
              width: "60%",
              height: "80vh",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ClusterMap;
