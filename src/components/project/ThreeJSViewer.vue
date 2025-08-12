<template>
  <div class="threejs-viewer-container">
    <div class="viewer-main-content">
      <div 
        ref="viewerContainer"
        class="threejs-viewer"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @wheel="onWheel"
      >
        <div v-if="loading" class="loading-overlay">
          <div class="loading-spinner"></div>
          <p>Loading 3D model...</p>
        </div>
        <div v-if="error" class="error-overlay">
          <div class="error-content">
            <i class="fa fa-exclamation-triangle"></i>
            <h4>Failed to Load 3D Model</h4>
            <p>{{ error }}</p>
            <button class="btn btn-primary" @click="retryLoad">
              <i class="fa fa-refresh"></i> Retry
            </button>
          </div>
        </div>
      </div>
      
      <div class="viewer-controls">
        <!-- Camera Movement Controls -->
        <div class="control-group">
          <div class="movement-controls">
            <button @click="moveCamera('up')" class="btn btn-sm btn-outline-secondary" title="Pan Up">
              <i class="fa fa-chevron-up"></i>
            </button>
            <div class="horizontal-controls">
              <button @click="moveCamera('left')" class="btn btn-sm btn-outline-secondary" title="Pan Left">
                <i class="fa fa-chevron-left"></i>
              </button>
              <button @click="resetView" class="btn btn-sm btn-primary" title="Reset View">
                <i class="fa fa-home"></i>
              </button>
              <button @click="moveCamera('right')" class="btn btn-sm btn-outline-secondary" title="Pan Right">
                <i class="fa fa-chevron-right"></i>
              </button>
            </div>
            <button @click="moveCamera('down')" class="btn btn-sm btn-outline-secondary" title="Pan Down">
              <i class="fa fa-chevron-down"></i>
            </button>
          </div>
        </div>

        <!-- Zoom Controls -->
        <div class="control-group">
          <button @click="zoomCamera('in')" class="btn btn-sm btn-outline-secondary" title="Zoom In">
            <i class="fa fa-search-plus"></i>
          </button>
          <button @click="zoomCamera('out')" class="btn btn-sm btn-outline-secondary" title="Zoom Out">
            <i class="fa fa-search-minus"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// Dynamic loader imports for better performance
const loaderCache = new Map()

async function getLoader(type) {
  if (loaderCache.has(type)) {
    return loaderCache.get(type)
  }

  try {
    let LoaderClass
    switch (type) {
      case 'ply':
        const { PLYLoader } = await import('three/examples/jsm/loaders/PLYLoader.js')
        LoaderClass = PLYLoader
        break
      case 'stl':
        const { STLLoader } = await import('three/examples/jsm/loaders/STLLoader.js')
        LoaderClass = STLLoader
        break
      case 'obj':
        const { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader.js')
        LoaderClass = OBJLoader
        break
      case 'gltf':
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
        LoaderClass = GLTFLoader
        break
      case 'fbx':
        const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader.js')
        LoaderClass = FBXLoader
        break
      default:
        throw new Error(`Unknown loader type: ${type}`)
    }

    const loader = new LoaderClass()
    loaderCache.set(type, loader)
    return loader
  } catch (error) {
    throw new Error(`3D viewer temporarily unavailable for ${type.toUpperCase()} files. Please try again later.`)
  }
}

const props = defineProps({
  modelUrl: {
    type: String,
    required: true
  },
  fileExtension: {
    type: String,
    required: true
  },
  width: {
    type: Number,
    default: null
  },
  height: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['load', 'error'])

// Template refs
const viewerContainer = ref(null)

// Component state
const loading = ref(false)
const error = ref(null)

// Three.js objects
let scene = null
let camera = null
let renderer = null
let controls = null
let currentModel = null
let animationId = null

// Control states
const autoRotate = ref(false) // Disabled by default - manual control only

onMounted(() => {
  initThreeJS()
  loadModel()
})

onUnmounted(() => {
  cleanup()
})

watch(() => props.modelUrl, () => {
  loadModel()
})

function initThreeJS() {
  if (!viewerContainer.value || typeof window === 'undefined') return

  // Get responsive dimensions with environment safety checks
  const containerWidth = props.width || 
    (typeof window !== 'undefined' ? Math.min(800, window.innerWidth * 0.9) : 800)
  const containerHeight = props.height || 
    (typeof window !== 'undefined' ? Math.min(600, window.innerHeight * 0.7) : 600)

  // Scene
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x000000) // Black background

  // Camera
  camera = new THREE.PerspectiveCamera(
    75,
    containerWidth / containerHeight,
    0.1,
    1000
  )
  camera.position.set(5, 5, 5)

  // Renderer
  renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    powerPreference: "high-performance",
    alpha: false
  })
  renderer.setSize(containerWidth, containerHeight)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  
  // Performance optimizations
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputEncoding = THREE.sRGBEncoding
  
  viewerContainer.value.appendChild(renderer.domElement)

  // Controls
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.enableZoom = true
  controls.autoRotate = autoRotate.value
  controls.autoRotateSpeed = 2.0

  // Lighting
  setupLighting()

  // Add grid helper for visual reference (subtle gray on black)
  const gridHelper = new THREE.GridHelper(20, 20, 0x333333, 0x222222)
  scene.add(gridHelper)
  
  // Add axis helper
  const axesHelper = new THREE.AxesHelper(5)
  scene.add(axesHelper)

  // Start render loop
  animate()
}

function setupLighting() {
  // Ambient light for overall illumination
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  // Main directional light
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0)
  directionalLight.position.set(10, 10, 5)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.width = 2048
  directionalLight.shadow.mapSize.height = 2048
  scene.add(directionalLight)

  // Additional fill lights for better illumination
  const fillLight1 = new THREE.DirectionalLight(0xffffff, 0.4)
  fillLight1.position.set(-10, 0, -5)
  scene.add(fillLight1)

  const fillLight2 = new THREE.DirectionalLight(0xffffff, 0.4)
  fillLight2.position.set(0, -10, 0)
  scene.add(fillLight2)

  // Add a hemisphere light for more natural lighting
  const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5)
  hemisphereLight.position.set(0, 20, 0)
  scene.add(hemisphereLight)
}

async function loadModel() {
  if (!props.modelUrl || !props.fileExtension) return

  loading.value = true
  error.value = null

  try {
    // Remove existing model
    if (currentModel) {
      scene.remove(currentModel)
      currentModel = null
    }
    
    // Remove any debug helpers (BoxHelper, etc.)
    const objectsToRemove = []
    scene.traverse(child => {
      if (child.type === 'BoxHelper') {
        objectsToRemove.push(child)
      }
    })
    objectsToRemove.forEach(obj => scene.remove(obj))

    const extension = props.fileExtension.toLowerCase()
    let model = null

    switch (extension) {
      case 'ply':
        model = await loadPLY()
        break
      case 'stl':
        model = await loadSTL()
        break
      case 'obj':
        model = await loadOBJ()
        break
      case 'gltf':
      case 'glb':
        model = await loadGLTF()
        break
      case 'fbx':
        model = await loadFBX()
        break
      default:
        throw new Error(`Unsupported file format: ${extension.toUpperCase()}`)
    }

    if (model) {
      currentModel = model
      scene.add(model)
      model.visible = true
      
      // Center and scale the model
      centerAndScaleModel(model)
      
      loading.value = false
      emit('load', model)
    } else {
      throw new Error('Model loaded but is null/undefined')
    }
  } catch (err) {
    error.value = err.message || 'Failed to load 3D model'
    loading.value = false
    emit('error', err)
  }
}



async function loadPLY() {
  const loader = await getLoader('ply')
  return new Promise((resolve, reject) => {
    loader.load(
      props.modelUrl,
      (geometry) => {
        // Check if PLY file has vertex colors
        const hasVertexColors = geometry.attributes.color !== undefined
        
        let material
        if (hasVertexColors) {
          // Check if the vertex colors are meaningful (not all black or very dark)
          const colors = geometry.attributes.color.array
          let hasValidColors = false
          
          // Sample a few vertices to check if colors are meaningful
          for (let i = 0; i < Math.min(colors.length, 30); i += 3) {
            const r = colors[i]
            const g = colors[i + 1] 
            const b = colors[i + 2]
            // If any color component is above 0.1, consider it a valid color
            if (r > 0.1 || g > 0.1 || b > 0.1) {
              hasValidColors = true
              break
            }
          }
          
          if (hasValidColors) {
            // Use vertex colors from PLY file
            material = new THREE.MeshLambertMaterial({ 
              vertexColors: true,
              side: THREE.DoubleSide
            })
          } else {
            // Colors are too dark/black, use default cream color
            material = new THREE.MeshPhongMaterial({ 
              color: 0xFFF8DC, // Cream color
              side: THREE.DoubleSide,
              shininess: 30,
              specular: 0x111111
            })
          }
        } else {
          // Use default cream color
          material = new THREE.MeshPhongMaterial({ 
            color: 0xFFF8DC, // Cream color
            side: THREE.DoubleSide,
            shininess: 30,
            specular: 0x111111
          })
        }
        
        const mesh = new THREE.Mesh(geometry, material)
        mesh.castShadow = true
        mesh.receiveShadow = true
        
        resolve(mesh)
      },
      (progress) => {
        // Progress callback - can be used for progress bar if needed
      },
      (error) => {
        reject(new Error(`Failed to load PLY file: ${error.message}`))
      }
    )
  })
}

async function loadSTL() {
  const loader = await getLoader('stl')
  
  return new Promise(async (resolve, reject) => {
    
    const onLoad = (geometry) => {
      // Check if STL file has vertex colors (Magics format or similar)
      const hasVertexColors = geometry.attributes.color !== undefined
      
      let material
      if (hasVertexColors) {
        // Use vertex colors from STL file (Magics format)
        material = new THREE.MeshLambertMaterial({ 
          vertexColors: true,
          side: THREE.DoubleSide
        })
      } else {
        // Use cream color for STL model
        material = new THREE.MeshPhongMaterial({ 
          color: 0xFFF8DC, // Cream color
          side: THREE.DoubleSide,
          shininess: 30,
          specular: 0x111111
        })
      }
      
      const mesh = new THREE.Mesh(geometry, material)
      mesh.castShadow = true
      mesh.receiveShadow = true
      resolve(mesh)
    }
    
    const onProgress = (progress) => {
      // Progress callback - can be used for progress bar if needed
    }
    
    const onError = async (error) => {
      // Try fallback loading method
      try {
        const response = await fetch(props.modelUrl)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const arrayBuffer = await response.arrayBuffer()
        const geometry = loader.parse(arrayBuffer)
        onLoad(geometry)
      } catch (fallbackErr) {
        reject(new Error(`Failed to load STL file: ${error.message || error}`))
      }
    }
    
    try {
      // Configure loader for cross-origin requests
      if (loader.setCrossOrigin) {
        loader.setCrossOrigin('anonymous')
      }
      
      loader.load(props.modelUrl, onLoad, onProgress, onError)
    } catch (err) {
      await onError(err)
    }
  })
}

async function loadOBJ() {
  const loader = await getLoader('obj')
  return new Promise((resolve, reject) => {
    loader.load(
      props.modelUrl,
      (object) => {
        // Apply material to all meshes in the object
        object.traverse((child) => {
          if (child.isMesh) {
            // Check if OBJ file has vertex colors or existing materials
            const hasVertexColors = child.geometry.attributes.color !== undefined
            const hasExistingMaterial = child.material && 
              child.material.map !== null || 
              child.material.color !== undefined
            
            if (hasVertexColors) {
              // Use vertex colors from OBJ file
              child.material = new THREE.MeshLambertMaterial({ 
                vertexColors: true,
                side: THREE.DoubleSide
              })
            } else if (hasExistingMaterial && child.material.color) {
              // Keep existing material colors but upgrade to Lambert for better lighting
              const existingColor = child.material.color
              child.material = new THREE.MeshLambertMaterial({ 
                color: existingColor,
                side: THREE.DoubleSide
              })
            } else {
              // Use default cream color
              child.material = new THREE.MeshPhongMaterial({ 
                color: 0xFFF8DC, // Cream color
                side: THREE.DoubleSide,
                shininess: 30,
                specular: 0x111111
              })
            }
            
            child.castShadow = true
            child.receiveShadow = true
          }
        })
        resolve(object)
      },
      (progress) => {
        // Progress callback - can be used for progress bar if needed
      },
      (error) => {
        reject(new Error(`Failed to load OBJ file: ${error.message}`))
      }
    )
  })
}

async function loadGLTF() {
  const loader = await getLoader('gltf')
  return new Promise((resolve, reject) => {
    loader.load(
      props.modelUrl,
      (gltf) => {
        const model = gltf.scene
        let hasOriginalColors = false
        
        model.traverse((child) => {
          if (child.isMesh) {
            // GLTF files typically preserve their original materials and colors
            // Check if the material has meaningful color information
            if (child.material && 
                (child.material.map || 
                 child.material.color || 
                 child.material.vertexColors)) {
              hasOriginalColors = true
            } else {
              // Apply default cream color if no material colors exist
              child.material = new THREE.MeshPhongMaterial({ 
                color: 0xFFF8DC, // Cream color
                side: THREE.DoubleSide,
                shininess: 30,
                specular: 0x111111
              })
            }
            
            child.castShadow = true
            child.receiveShadow = true
          }
        })
        
        resolve(model)
      },
      (progress) => {
        // Progress callback - can be used for progress bar if needed
      },
      (error) => {
        reject(new Error(`Failed to load GLTF file: ${error.message}`))
      }
    )
  })
}

async function loadFBX() {
  const loader = await getLoader('fbx')
  return new Promise((resolve, reject) => {
    loader.load(
      props.modelUrl,
      (object) => {
        let hasOriginalColors = false
        
        object.traverse((child) => {
          if (child.isMesh) {
            // FBX files often preserve their original materials and colors
            // Check if the material has meaningful color information
            if (child.material && 
                (child.material.map || 
                 child.material.color || 
                 child.material.vertexColors ||
                 Array.isArray(child.material))) {
              hasOriginalColors = true
            } else {
              // Apply default cream color if no material colors exist
              child.material = new THREE.MeshPhongMaterial({ 
                color: 0xFFF8DC, // Cream color
                side: THREE.DoubleSide,
                shininess: 30,
                specular: 0x111111
              })
            }
            
            child.castShadow = true
            child.receiveShadow = true
          }
        })
        
        resolve(object)
      },
      (progress) => {
        // Progress callback - can be used for progress bar if needed
      },
      (error) => {
        reject(new Error(`Failed to load FBX file: ${error.message}`))
      }
    )
  })
}

function centerAndScaleModel(model) {
  // Reset the model position to origin
  model.position.set(0, 0, 0)
  
  // Compute the bounding box of the model's geometry
  const geometry = model.geometry
  geometry.computeBoundingBox()
  const box = geometry.boundingBox
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  
  // Translate geometry to center it
  geometry.translate(-center.x, -center.y, -center.z)

  // Calculate appropriate scale
  const maxDim = Math.max(size.x, size.y, size.z)
  
  // Scale model to fit nicely in view (target size of 4 units)
  const targetSize = 4
  const scale = targetSize / maxDim
  model.scale.setScalar(scale)
  
  // Update the model's matrix
  model.updateMatrix()
  model.updateMatrixWorld(true)

  // Position camera to view the model
  const distance = targetSize * 2.5
  camera.position.set(distance, distance, distance)
  camera.lookAt(0, 0, 0)
  
  // Update controls
  controls.target.set(0, 0, 0)
  controls.update()
  
  // Force a render
  renderer.render(scene, camera)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  
  if (controls) {
    controls.update()
  }
  
  if (renderer && scene && camera) {
    renderer.render(scene, camera)
  }
}

function resetView() {
  if (currentModel) {
    centerAndScaleModel(currentModel)
  }
}

function moveCamera(direction) {
  if (!controls || !camera) return

  const moveDistance = 1
  const target = controls.target.clone()

  switch (direction) {
    case 'up':
      target.y += moveDistance
      break
    case 'down':
      target.y -= moveDistance
      break
    case 'left':
      target.x -= moveDistance
      break
    case 'right':
      target.x += moveDistance
      break
  }

  controls.target.copy(target)
  controls.update()
}

function zoomCamera(direction) {
  if (!camera || !controls) return

  const zoomFactor = 0.1
  const direction3D = new THREE.Vector3()
  
  // Get the direction from camera to target
  direction3D.subVectors(camera.position, controls.target).normalize()

  if (direction === 'in') {
    // Move camera closer to target
    camera.position.add(direction3D.multiplyScalar(-zoomFactor * controls.getDistance()))
  } else if (direction === 'out') {
    // Move camera away from target
    camera.position.add(direction3D.multiplyScalar(zoomFactor * controls.getDistance()))
  }

  controls.update()
}



function retryLoad() {
  loadModel()
}

function cleanup() {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  
  // Dispose of scene objects to prevent memory leaks
  if (scene) {
    scene.traverse((object) => {
      if (object.isMesh) {
        // Dispose geometry
        if (object.geometry) {
          object.geometry.dispose()
        }
        
        // Dispose materials (handle both single and array materials)
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose())
        } else if (object.material) {
          object.material.dispose()
        }
      }
    })
    scene.clear()
  }
  
  if (renderer) {
    renderer.dispose()
    // Also dispose render target if any
    renderer.forceContextLoss()
  }
  
  if (controls) {
    controls.dispose()
  }
  
  // Clear loader cache to free memory
  loaderCache.clear()
}

// Mouse interaction helpers (for touch devices)
function onMouseDown(event) {
  // Handled by OrbitControls
}

function onMouseMove(event) {
  // Handled by OrbitControls
}

function onMouseUp(event) {
  // Handled by OrbitControls
}

function onWheel(event) {
  // Handled by OrbitControls
}
</script>

<style scoped>
.threejs-viewer-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.viewer-main-content {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.threejs-viewer {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.loading-overlay,
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(240, 240, 240, 0.9);
  z-index: 10;
}

.loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-overlay {
  background-color: rgba(248, 249, 250, 0.95);
}

.error-content {
  text-align: center;
  max-width: 300px;
  padding: 1rem;
}

.error-content i {
  font-size: 2rem;
  color: #dc3545;
  margin-bottom: 1rem;
}

.error-content h4 {
  color: #495057;
  margin-bottom: 1rem;
}

.error-content p {
  color: #6c757d;
  margin-bottom: 1rem;
}

.viewer-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 0.5rem;
  border: 1px solid #dee2e6;
  align-items: center;
  min-width: 120px;
}

.control-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.movement-controls {
  display: grid;
  grid-template-rows: 1fr 1fr 1fr;
  grid-template-columns: 1fr;
  gap: 0.25rem;
  align-items: center;
}

.horizontal-controls {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

.viewer-controls .btn {
  min-width: 40px;
  min-height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
}

.viewer-controls .btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}



@media (max-width: 768px) {
  .threejs-viewer-container {
    width: 100%;
  }
  
  .viewer-main-content {
    flex-direction: column;
    width: 100%;
    align-items: center;
  }
  
  .viewer-controls {
    flex-direction: row;
    gap: 0.75rem;
    padding: 0.75rem;
    min-width: auto;
    width: 100%;
    justify-content: center;
  }
  
  .control-group {
    flex: 0 0 auto;
  }
  
  .movement-controls {
    max-width: 150px;
  }
  
  .viewer-controls .btn {
    min-width: 45px;
    min-height: 40px;
  }
}
</style> 