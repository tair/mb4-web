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

// Maximum vertices per draw call to avoid WebGL limits
// Using 15M for better compatibility across different GPUs/browsers
const MAX_VERTICES_PER_BATCH = 15000000 // 15M vertices per batch

/**
 * Splits a geometry into multiple smaller geometries if it exceeds the vertex limit.
 * Handles both indexed and non-indexed geometries correctly.
 * Returns an array of geometries, each with at most MAX_VERTICES_PER_BATCH vertices.
 */
function splitGeometryIntoBatches(geometry) {
  const positionAttribute = geometry.attributes.position
  if (!positionAttribute) {
    console.error('Geometry has no position attribute')
    return [geometry]
  }
  
  const totalVertices = positionAttribute.count
  
  // If within limit, return as single-item array
  if (totalVertices <= MAX_VERTICES_PER_BATCH) {
    return [geometry]
  }
  
  console.log(`Splitting geometry with ${totalVertices.toLocaleString()} vertices into batches of ${MAX_VERTICES_PER_BATCH.toLocaleString()}`)
  
  // For indexed geometries, convert to non-indexed first to avoid breaking triangles
  // This is safer than trying to split indexed geometry across batch boundaries
  if (geometry.index) {
    console.log('Converting indexed geometry to non-indexed for safe batching')
    geometry = geometry.toNonIndexed()
  }
  
  const batches = []
  const numBatches = Math.ceil(totalVertices / MAX_VERTICES_PER_BATCH)
  
  // Get all attributes from the geometry
  const attributes = geometry.attributes
  
  for (let batchIndex = 0; batchIndex < numBatches; batchIndex++) {
    const startVertex = batchIndex * MAX_VERTICES_PER_BATCH
    const endVertex = Math.min(startVertex + MAX_VERTICES_PER_BATCH, totalVertices)
    const batchVertexCount = endVertex - startVertex
    
    // Create new geometry for this batch
    const batchGeometry = new THREE.BufferGeometry()
    
    // Copy position attribute
    const srcPositions = attributes.position
    const positions = new Float32Array(batchVertexCount * 3)
    for (let i = 0; i < batchVertexCount; i++) {
      const srcIndex = startVertex + i
      positions[i * 3] = srcPositions.getX(srcIndex)
      positions[i * 3 + 1] = srcPositions.getY(srcIndex)
      positions[i * 3 + 2] = srcPositions.getZ(srcIndex)
    }
    batchGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    
    // Copy normal attribute if it exists
    if (attributes.normal) {
      const srcNormals = attributes.normal
      const normals = new Float32Array(batchVertexCount * 3)
      for (let i = 0; i < batchVertexCount; i++) {
        const srcIndex = startVertex + i
        normals[i * 3] = srcNormals.getX(srcIndex)
        normals[i * 3 + 1] = srcNormals.getY(srcIndex)
        normals[i * 3 + 2] = srcNormals.getZ(srcIndex)
      }
      batchGeometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
    }
    
    // Copy color attribute if it exists
    if (attributes.color) {
      const srcColors = attributes.color
      const colors = new Float32Array(batchVertexCount * 3)
      for (let i = 0; i < batchVertexCount; i++) {
        const srcIndex = startVertex + i
        colors[i * 3] = srcColors.getX(srcIndex)
        colors[i * 3 + 1] = srcColors.getY(srcIndex)
        colors[i * 3 + 2] = srcColors.getZ(srcIndex)
      }
      batchGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    }
    
    // Copy UV attribute if it exists
    if (attributes.uv) {
      const srcUVs = attributes.uv
      const uvs = new Float32Array(batchVertexCount * 2)
      for (let i = 0; i < batchVertexCount; i++) {
        const srcIndex = startVertex + i
        uvs[i * 2] = srcUVs.getX(srcIndex)
        uvs[i * 2 + 1] = srcUVs.getY(srcIndex)
      }
      batchGeometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
    }
    
    batches.push(batchGeometry)
    console.log(`Batch ${batchIndex + 1}/${numBatches}: ${batchVertexCount.toLocaleString()} vertices`)
  }
  
  // Dispose original geometry to free memory
  geometry.dispose()
  
  return batches
}

/**
 * Creates meshes from a geometry, splitting into batches if needed.
 * Returns either a single mesh or a THREE.Group containing multiple meshes.
 * @param {THREE.BufferGeometry} geometry - The geometry to create meshes from
 * @param {THREE.Material} material - The material to use (will be shared across all batches)
 * @param {Object} transform - Optional transform to apply (position, rotation, scale)
 */
function createMeshFromGeometry(geometry, material, transform = null) {
  try {
    const geometries = splitGeometryIntoBatches(geometry)
    
    if (geometries.length === 1) {
      // Single mesh
      const mesh = new THREE.Mesh(geometries[0], material)
      mesh.castShadow = true
      mesh.receiveShadow = true
      
      // Apply transform if provided
      if (transform) {
        if (transform.position) mesh.position.copy(transform.position)
        if (transform.rotation) mesh.rotation.copy(transform.rotation)
        if (transform.scale) mesh.scale.copy(transform.scale)
      }
      
      return mesh
    } else {
      // Multiple meshes in a group - share the same material for efficiency
      const group = new THREE.Group()
      
      for (let i = 0; i < geometries.length; i++) {
        const mesh = new THREE.Mesh(geometries[i], material)
        mesh.castShadow = true
        mesh.receiveShadow = true
        mesh.name = `batch_${i}`
        group.add(mesh)
      }
      
      // Apply transform to the group if provided
      if (transform) {
        if (transform.position) group.position.copy(transform.position)
        if (transform.rotation) group.rotation.copy(transform.rotation)
        if (transform.scale) group.scale.copy(transform.scale)
      }
      
      console.log(`Created ${geometries.length} batched meshes in a group (sharing material)`)
      return group
    }
  } catch (error) {
    console.error('Error creating batched mesh:', error)
    // Fallback: create a single mesh without batching
    const mesh = new THREE.Mesh(geometry, material)
    mesh.castShadow = true
    mesh.receiveShadow = true
    return mesh
  }
}

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
const lastLoadedSignature = ref(null)
const currentLoadSignature = ref(null)

// Abort controller for canceling in-flight model loads
let modelAbortController = null

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

watch(() => props.fileExtension, () => {
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

  // Add grid helper for visual reference (subtle colors for dark blue-gray background)
  const gridHelper = new THREE.GridHelper(20, 20, 0x555555, 0x444444)
  scene.add(gridHelper)
  
  // Add axis helper
  const axesHelper = new THREE.AxesHelper(5)
  scene.add(axesHelper)

  // Start render loop
  animate()
}

function setupLighting() {
  // Strong ambient light for overall illumination - ensures models are always visible
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
  scene.add(ambientLight)

  // Main directional light
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0)
  directionalLight.position.set(10, 10, 5)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.width = 2048
  directionalLight.shadow.mapSize.height = 2048
  scene.add(directionalLight)

  // Additional fill lights for better illumination from all sides
  const fillLight1 = new THREE.DirectionalLight(0xffffff, 0.6)
  fillLight1.position.set(-10, 5, -5)
  scene.add(fillLight1)

  const fillLight2 = new THREE.DirectionalLight(0xffffff, 0.6)
  fillLight2.position.set(5, -10, 5)
  scene.add(fillLight2)

  const fillLight3 = new THREE.DirectionalLight(0xffffff, 0.6)
  fillLight3.position.set(-5, 5, 10)
  scene.add(fillLight3)

  // Add a hemisphere light for more natural lighting
  const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x666666, 0.7)
  hemisphereLight.position.set(0, 20, 0)
  scene.add(hemisphereLight)
}

async function loadModel() {
  if (!props.modelUrl || !props.fileExtension) return

  const signature = `${props.modelUrl}|${props.fileExtension.toLowerCase()}`

  // Prevent duplicate concurrent loads of the same asset
  if (currentLoadSignature.value === signature) {
    return
  }

  // Skip if already successfully loaded
  if (lastLoadedSignature.value === signature && currentModel && !error.value) {
    return
  }

  // Abort any in-flight model load
  if (modelAbortController) {
    modelAbortController.abort()
    modelAbortController = null
  }

  // Create new abort controller for this load
  modelAbortController = new AbortController()
  const signal = modelAbortController.signal

  currentLoadSignature.value = signature
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
        model = await loadPLY(signal)
        break
      case 'stl':
        model = await loadSTL(signal)
        break
      case 'obj':
        model = await loadOBJ(signal)
        break
      case 'gltf':
      case 'glb':
        model = await loadGLTF(signal)
        break
      case 'fbx':
        model = await loadFBX(signal)
        break
      default:
        throw new Error(`Unsupported file format: ${extension.toUpperCase()}`)
    }

    if (model) {
      currentModel = model
      scene.add(model)
      model.visible = true
      
      // Ensure all meshes are visible and have proper materials
      model.traverse(child => {
        if (child.isMesh) {
          child.visible = true
        }
      })
      
      // Center and scale the model
      centerAndScaleModel(model)
      
      loading.value = false
      currentLoadSignature.value = null
      lastLoadedSignature.value = signature
      emit('load', model)
    } else {
      throw new Error('Model loaded but is null/undefined')
    }
  } catch (err) {
    // Ignore aborted requests
    if (err.name === 'AbortError' || signal.aborted) {
      return
    }
    error.value = err.message || 'Failed to load 3D model'
    loading.value = false
    currentLoadSignature.value = null
    lastLoadedSignature.value = null
    emit('error', err)
  }
}



async function loadPLY(signal) {
  const loader = await getLoader('ply')
  
  // Fetch file with abort signal (use plain fetch for S3 URLs to avoid CORS issues)
  const response = await fetch(props.modelUrl, { signal })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  
  const arrayBuffer = await response.arrayBuffer()
  const geometry = loader.parse(arrayBuffer)
  
  // Ensure geometry has proper normals - many PLY files lack them
  if (!geometry.attributes.normal) {
    geometry.computeVertexNormals()
  }
  
  // Always use cream color for all PLY models - using MeshLambertMaterial for better reliability
  const material = new THREE.MeshLambertMaterial({ 
    color: 0xFFF8DC, // Cream color
    side: THREE.DoubleSide
  })
  
  // Use batching to handle large geometries
  return createMeshFromGeometry(geometry, material)
}

async function loadSTL(signal) {
  const loader = await getLoader('stl')
  
  // Fetch file with abort signal (use plain fetch for S3 URLs to avoid CORS issues)
  const response = await fetch(props.modelUrl, { signal })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  
  const arrayBuffer = await response.arrayBuffer()
  const geometry = loader.parse(arrayBuffer)
  
  // Ensure geometry has proper normals - STL files can also lack them
  if (!geometry.attributes.normal) {
    geometry.computeVertexNormals()
  }
  
  // Always use cream color for all STL models
  const material = new THREE.MeshLambertMaterial({ 
    color: 0xFFF8DC, // Cream color
    side: THREE.DoubleSide
  })
  
  // Use batching to handle large geometries
  return createMeshFromGeometry(geometry, material)
}

async function loadOBJ(signal) {
  const loader = await getLoader('obj')
  
  // Fetch file with abort signal (use plain fetch for S3 URLs to avoid CORS issues)
  const response = await fetch(props.modelUrl, { signal })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  
  const text = await response.text()
  const object = loader.parse(text)
  
  // Create a new group to hold batched meshes
  const batchedGroup = new THREE.Group()
  
  // Create shared material once for all meshes (more efficient)
  const sharedMaterial = new THREE.MeshLambertMaterial({ 
    color: 0xFFF8DC, // Cream color
    side: THREE.DoubleSide
  })
  
  // Apply cream material and batching to all meshes in the object
  object.traverse((child) => {
    if (child.isMesh) {
      // Ensure geometry has proper normals - OBJ files can also lack them
      if (!child.geometry.attributes.normal) {
        child.geometry.computeVertexNormals()
      }
      
      // Create batched mesh(es) from this geometry with transform
      const transform = {
        position: child.position,
        rotation: child.rotation,
        scale: child.scale
      }
      
      const batchedMesh = createMeshFromGeometry(child.geometry, sharedMaterial, transform)
      batchedGroup.add(batchedMesh)
    }
  })
  
  return batchedGroup.children.length > 0 ? batchedGroup : object
}

async function loadGLTF(signal) {
  const loader = await getLoader('gltf')
  
  // Fetch file with abort signal (use plain fetch for S3 URLs to avoid CORS issues)
  const response = await fetch(props.modelUrl, { signal })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  
  const arrayBuffer = await response.arrayBuffer()
  
  // Parse the GLTF data
  return new Promise((resolve, reject) => {
    loader.parse(
      arrayBuffer,
      '', // resource path
      (gltf) => {
        const model = gltf.scene
        
        // Create a new group to hold batched meshes
        const batchedGroup = new THREE.Group()
        
        // Create shared material once for all meshes (more efficient)
        const sharedMaterial = new THREE.MeshLambertMaterial({ 
          color: 0xFFF8DC, // Cream color
          side: THREE.DoubleSide
        })
        
        model.traverse((child) => {
          if (child.isMesh) {
            // Ensure geometry has proper normals
            if (!child.geometry.attributes.normal) {
              child.geometry.computeVertexNormals()
            }
            
            // Create batched mesh(es) from this geometry with transform
            const transform = {
              position: child.position,
              rotation: child.rotation,
              scale: child.scale
            }
            
            const batchedMesh = createMeshFromGeometry(child.geometry, sharedMaterial, transform)
            batchedGroup.add(batchedMesh)
          }
        })
        
        resolve(batchedGroup.children.length > 0 ? batchedGroup : model)
      },
      (error) => {
        reject(new Error(`Failed to parse GLTF file: ${error.message || error}`))
      }
    )
  })
}

async function loadFBX(signal) {
  const loader = await getLoader('fbx')
  
  // Fetch file with abort signal (use plain fetch for S3 URLs to avoid CORS issues)
  const response = await fetch(props.modelUrl, { signal })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  
  const arrayBuffer = await response.arrayBuffer()
  const object = loader.parse(arrayBuffer, '')
  
  // Create a new group to hold batched meshes
  const batchedGroup = new THREE.Group()
  
  // Create shared material once for all meshes (more efficient)
  const sharedMaterial = new THREE.MeshLambertMaterial({ 
    color: 0xFFF8DC, // Cream color
    side: THREE.DoubleSide
  })
  
  object.traverse((child) => {
    if (child.isMesh) {
      // Ensure geometry has proper normals
      if (!child.geometry.attributes.normal) {
        child.geometry.computeVertexNormals()
      }
      
      // Create batched mesh(es) from this geometry with transform
      const transform = {
        position: child.position,
        rotation: child.rotation,
        scale: child.scale
      }
      
      const batchedMesh = createMeshFromGeometry(child.geometry, sharedMaterial, transform)
      batchedGroup.add(batchedMesh)
    }
  })
  
  return batchedGroup.children.length > 0 ? batchedGroup : object
}

function centerAndScaleModel(model) {
  // Reset the model position to origin
  model.position.set(0, 0, 0)
  model.rotation.set(0, 0, 0)
  model.scale.set(1, 1, 1)
  
  // Compute the bounding box of the entire model
  const box = new THREE.Box3().setFromObject(model)
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  
  // CENTER THE GEOMETRY DIRECTLY (not the mesh position)
  model.traverse(child => {
    if (child.isMesh && child.geometry) {
      child.geometry.translate(-center.x, -center.y, -center.z)
    }
  })

  // Calculate appropriate scale AFTER centering
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
  // Abort any in-flight model load
  if (modelAbortController) {
    modelAbortController.abort()
    modelAbortController = null
  }
  
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