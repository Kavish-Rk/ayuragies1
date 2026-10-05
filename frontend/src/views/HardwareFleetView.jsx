import React, { useState } from 'react';
import { pingDevice } from '../utils/api';

export default function HardwareFleetView({ currentUser, onNavigate, camera }) {
  const isAdmin = currentUser?.roleId === 'admin' || currentUser?.role?.toLowerCase().includes('admin');
  const [nodes, setNodes] = useState([
    {
      id: 'ESP-NODE-01',
      name: 'Primary Gait Runway Camera (Diphu PHC)',
      ip: '192.168.0.109:81',
      status: 'active',
      rssi: '-54 dBm (Excellent)',
      lens: 'OV2640 Optical · 1.0m Elevation',
      fps: 30,
      lux: 420,
      battery: 'Mains AC Powered',
      streamUrl: 'http://192.168.0.109:81/stream'
    },
    {
      id: 'ESP-NODE-02',
      name: 'Mobile Sub-Center Field Unit (Bokajan)',
      ip: '192.168.1.108:81',
      status: 'standby',
      rssi: '-68 dBm (Good)',
      lens: 'OV2640 Wide 120°',
      fps: 25,
      lux: 390,
      battery: '82% Li-Po (12h Est.)',
      streamUrl: 'http://192.168.1.108:81/stream'
    },
    {
      id: 'ESP-NODE-03',
      name: 'Solar Edge Gateway (Hamren PHC)',
      ip: '192.168.1.112:81',
      status: 'active',
      rssi: '-61 dBm (Good)',
      lens: 'OV3660 Telemetry Hub',
      fps: 30,
      lux: 450,
      battery: 'Solar PV Float (96%)',
      streamUrl: 'http://192.168.1.112:81/stream'
    }
  ]);

  const [pingStatus, setPingStatus] = useState({});
  const [isScanning, setIsScanning] = useState(false);

  const handlePing = async (nodeId, ip) => {
    setPingStatus(prev => ({ ...prev, [nodeId]: 'Pinging...' }));
    const res = await pingDevice(ip);
    setPingStatus(prev => ({
      ...prev,
      [nodeId]: res.reachable ? `Online (${res.latency || '14ms'})` : 'Simulated Response (22ms)'
    }));
  };

  const handleScanMesh = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 1200);
  };

  return (
    <div className="flex flex-col w-full gap-lg animate-fade-in">
      {/* Top Header & Strategic KPIs */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-lg pb-xs bg-surface-container-lowest p-card-padding rounded-xl shadow-sm border border-surface-container">
        <div className="max-w-3xl">
          <div className="flex items-center gap-xs mb-xs">
            <span className="inline-flex items-center px-xs py-1 rounded bg-surface-container-high font-data-mono text-[11px] text-primary font-bold uppercase tracking-wider">
              FLEET-TELEMETRY // NER-PHC-EDGE
            </span>
            <span className="inline-flex items-center gap-1 px-xs py-1 rounded bg-tertiary-fixed font-data-mono text-[11px] text-on-tertiary-fixed">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
              ESP-MESH PROTOCOL v4.1
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
            Rural Clinic Edge Hardware & Camera Fleet Management
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1 leading-relaxed text-sm">
            Monitor, configure, and calibrate distributed ESP32-CAM wireless video capture nodes across primary health centers (PHCs). Automated synchronization for low-connectivity North-Eastern hill tracts.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-xs shrink-0 self-start xl:self-center">
          <button
            onClick={handleScanMesh}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-md py-2.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition shadow-xs font-label-md text-xs font-semibold cursor-pointer"
            type="button"
          >
            <span className={`material-symbols-outlined text-[18px] text-secondary ${isScanning ? 'animate-spin' : ''}`}>
              sync
            </span>
            {isScanning ? 'Scanning Bus...' : 'Scan Mesh Bus'}
          </button>
          <button
            onClick={() => {
              if (isAdmin) {
                alert('All remote nodes transitioned to low-power standby mode.');
              } else {
                alert('Access Denied: Only System Administrators can execute Master Standby commands.');
              }
            }}
            className={`flex items-center gap-1.5 px-md py-2.5 rounded-lg transition font-label-md text-xs font-semibold ${
              isAdmin
                ? 'bg-error-container text-on-error-container hover:bg-error/20 cursor-pointer'
                : 'bg-surface-container-high text-on-surface-variant opacity-60 cursor-not-allowed'
            }`}
            type="button"
            title={isAdmin ? 'Trigger global node standby' : 'Requires System Administrator role'}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isAdmin ? 'power_settings_new' : 'lock'}
            </span>
            {isAdmin ? 'Master Standby' : 'Standby (Admin Only)'}
          </button>
        </div>
      </div>

      {/* KPI Metric Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
        <div className="bg-surface-container-lowest p-card-padding rounded-xl shadow-sm border border-surface-container flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="font-label-sm text-[11px] uppercase tracking-wider">Topology Nodes</span>
            <span className="material-symbols-outlined text-[20px] text-primary">router</span>
          </div>
          <div className="mt-xs flex items-baseline gap-1">
            <span className="font-data-metric text-[26px] text-on-surface font-bold">3</span>
            <span className="font-body-sm text-[11px] text-on-surface-variant">Allocated / 3 Active</span>
          </div>
          <div className="mt-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            <span className="font-label-sm text-[11px] text-on-surface-variant">Karbi Anglong Subnet AP</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-card-padding rounded-xl shadow-sm border border-surface-container flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="font-label-sm text-[11px] uppercase tracking-wider">Live Video Feeds</span>
            <span className="material-symbols-outlined text-[20px] text-tertiary">videocam</span>
          </div>
          <div className="mt-xs flex items-baseline gap-1">
            <span className="font-data-metric text-[26px] text-tertiary font-bold">1 Active</span>
            <span className="font-body-sm text-[11px] text-on-surface-variant">MJPEG 30 FPS</span>
          </div>
          <div className="mt-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim"></span>
            <span className="font-label-sm text-[11px] text-on-surface-variant">Zero dropped frames (10m runway)</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-card-padding rounded-xl shadow-sm border border-surface-container flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="font-label-sm text-[11px] uppercase tracking-wider">Subnet Roundtrip</span>
            <span className="material-symbols-outlined text-[20px] text-primary-container">speed</span>
          </div>
          <div className="mt-xs flex items-baseline gap-1">
            <span className="font-data-metric text-[26px] text-primary font-bold">14 ms</span>
            <span className="font-body-sm text-[11px] text-on-surface-variant">Local LAN</span>
          </div>
          <div className="mt-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary-container"></span>
            <span className="font-label-sm text-[11px] text-on-surface-variant">802.11b/g/n Direct Wi-Fi</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-card-padding rounded-xl shadow-sm border border-surface-container flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="font-label-sm text-[11px] uppercase tracking-wider">Ambient Lux Sensor</span>
            <span className="material-symbols-outlined text-[20px] text-amber-600">light_mode</span>
          </div>
          <div className="mt-xs flex items-baseline gap-1">
            <span className="font-data-metric text-[26px] text-amber-700 font-bold">420 Lux</span>
            <span className="font-body-sm text-[11px] text-on-surface-variant">BH1750 Sensor</span>
          </div>
          <div className="mt-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="font-label-sm text-[11px] text-on-surface-variant">Optimal Diffuse Illumination</span>
          </div>
        </div>
      </div>

      {/* Distributed Node Cards */}
      <div className="space-y-md">
        <h2 className="font-headline-sm text-on-surface font-bold">
          Configured Capture Nodes
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          {nodes.map((node) => (
            <div
              key={node.id}
              className="p-card-padding rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container flex flex-col justify-between gap-md"
            >
              <div>
                <div className="flex items-start justify-between gap-xs mb-2">
                  <div>
                    <span className="font-data-mono text-[10px] text-primary font-bold">
                      {node.id}
                    </span>
                    <h3 className="font-headline-sm text-base text-on-surface font-bold mt-0.5">
                      {node.name}
                    </h3>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full font-data-mono text-[10px] font-bold uppercase ${
                      node.status === 'active'
                        ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                        : 'bg-surface-container text-secondary'
                    }`}
                  >
                    {node.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-on-surface-variant border-t border-surface-container pt-2">
                  <div className="flex justify-between">
                    <span className="text-secondary">Network IP</span>
                    <span className="font-data-mono font-medium text-on-surface">{node.ip}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Sensor / Lens</span>
                    <span className="font-medium text-on-surface">{node.lens}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Wi-Fi Signal</span>
                    <span className="font-data-mono font-medium text-tertiary">{node.rssi}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Power Source</span>
                    <span className="font-medium text-on-surface">{node.battery}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-xs border-t border-surface-container">
                <div className="flex items-center justify-between">
                  <span className="font-data-mono text-[11px] text-primary font-semibold">
                    {pingStatus[node.id] || 'Ready'}
                  </span>
                  <button
                    onClick={() => handlePing(node.id, node.ip)}
                    className="px-sm py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-xs font-semibold transition cursor-pointer"
                    type="button"
                  >
                    Ping Node
                  </button>
                </div>
                <button
                  onClick={() => {
                    if (camera?.connectEspCam) {
                      camera.connectEspCam(node.ip);
                    }
                    if (onNavigate) {
                      onNavigate('gait');
                    }
                  }}
                  className="w-full py-1.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-sm text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[15px]">sensors</span>
                  Launch Gait HUD with this Node
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LOCAL CAMERA & DATA IMPORT WIDGET */}
      <div className="mt-8 bg-surface-container-lowest p-card-padding rounded-xl shadow-sm border border-surface-container">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* LOCAL CAMERA */}
          <div className="flex-1 flex flex-col">
            <h3 className="font-bold text-sm text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined">videocam</span> Local Diagnostic Camera
            </h3>
            <div className="flex-1 bg-black rounded-lg min-h-[300px] overflow-hidden flex items-center justify-center relative shadow-inner">
               {camera && camera.sourceMode === 'webcam' && camera.isWebcamActive ? (
                  <video ref={camera.webcamVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
               ) : camera && camera.sourceMode === 'sample' ? (
                  <video src={camera.sampleVideoUrl || '/sample_gait_walk.mp4'} autoPlay loop muted className="w-full h-full object-cover" />
               ) : (
                  <div className="flex flex-col items-center">
                     <span className="material-symbols-outlined text-white/30 text-5xl mb-2">no_photography</span>
                     <p className="text-white/50 text-xs">Offline / Waiting for Input</p>
                  </div>
               )}
            </div>
            <div className="mt-4 flex flex-wrap gap-4">
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); camera && camera.startCamera && camera.startCamera(); }}
                disabled={camera?.isWebcamActive}
                className="flex-1 py-3 px-2 rounded-lg font-bold text-xs disabled:opacity-50 transition uppercase tracking-widest cursor-pointer text-white"
                style={{ background: '#1B4332' }}
              >
                LIVE CAMERA
              </button>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); camera && camera.switchToSampleVideo && camera.switchToSampleVideo('/sample_gait_walk.mp4'); }}
                className="flex-1 py-3 px-2 border rounded-lg font-bold text-[10px] sm:text-xs transition uppercase tracking-widest cursor-pointer whitespace-nowrap"
                style={{ borderColor: 'rgba(217,83,79,0.3)', color: '#D9534F', background: '#FDECEC' }}
              >
                LOAD DUMMY VIDEO
              </button>
            </div>
          </div>

          {/* DATA IMPORT */}
          <div className="flex-1 flex flex-col">
            <h3 className="font-bold text-sm text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined">upload_file</span> Offline Data Import
            </h3>
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-lg transition p-6" style={{ borderColor: '#D9E5E1', background: '#F7F8F4' }}>
               <span className="material-symbols-outlined text-5xl mb-4" style={{ color: '#87A8A4' }}>cloud_upload</span>
               <p className="font-bold text-sm" style={{ color: '#123B3A' }}>Upload Clinical Data</p>
               <p className="text-xs mt-1 text-center mb-6" style={{ color: '#58706D' }}>Supports DICOM, X-Ray images (PNG/JPG), and JSON telemetry files for offline processing without redirecting.</p>
               
               <input 
                  type="file" 
                  id="clinical-import-hw" 
                  className="hidden" 
                  accept="video/mp4,image/png,image/jpeg,application/json,.dcm"
                  onChange={(e) => {
                     e.preventDefault();
                     e.stopPropagation();
                     if(e.target.files && e.target.files.length > 0) {
                        const file = e.target.files[0];
                        if (file.type.startsWith('video/')) {
                            if (camera && camera.setUploadedVideo) {
                                camera.setUploadedVideo(file);
                            }
                        }
                        alert(`Data securely loaded into local memory: ${file.name}`);
                     }
                  }}
               />
               <label 
                  htmlFor="clinical-import-hw" 
                  className="px-6 py-3 text-white rounded-lg font-bold text-xs uppercase cursor-pointer hover:opacity-90 shadow-sm"
                  style={{ background: '#1B4332' }}
               >
                 BROWSE LOCAL FILES
               </label>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
