import { Group, AnimationMixer, Clock, PointLight } from 'three'
import GLTFLoader from 'three-gltf-loader'

import { Analyser } from 'classes/Analyser'
import Page from 'classes/Page'

import Triangle from './Triangle'

export default class Visualization extends Page {
  constructor () {
    super({
      element: null,
      name: 'Visualization',
      url: '/'
    })

    this.wrapper = new Group()
    this.clock = new Clock()
    this.mixer = null

    // Create triangles around the model
    for (let index = 0; index < 100; index++) {
      const triangle = new Triangle({ index })
      this.wrapper.add(triangle)
    }

    // Load the GLB model
    this.loadModel()
  }

  loadModel () {
    const loader = new GLTFLoader()
    
    loader.load(
      require('../../assets/mechamodel.glb'),
      (gltf) => {
        this.model = gltf.scene
        
        // Scale and position the model
        this.model.scale.set(30, 30, 30)
        this.model.position.set(0, 0, 0)
        
        // Add glow effect with point lights
        const orangeLight = new PointLight(0xff6600, 2, 200)
        orangeLight.position.set(0, 0, 50)
        this.model.add(orangeLight)
        
        const cyanLight = new PointLight(0x00ffcc, 1.5, 150)
        cyanLight.position.set(0, 50, 0)
        this.model.add(cyanLight)
        
        // Setup animations if the model has them
        if (gltf.animations && gltf.animations.length > 0) {
          this.mixer = new AnimationMixer(this.model)
          gltf.animations.forEach((clip) => {
            this.mixer.clipAction(clip).play()
          })
        }
        
        this.wrapper.add(this.model)
        console.log('Model loaded successfully')
      },
      (progress) => {
        console.log('Loading model...', (progress.loaded / progress.total * 100) + '%')
      },
      (error) => {
        console.error('Error loading model:', error)
      }
    )
  }

  async show () {
    await new Promise(resolve => {
      Promise.all(
        this.wrapper.children.map((child) => {
          if (child.appear) return child.appear()
          return Promise.resolve()
        })
      ).then(() => resolve())
    })
  }

  async hide () {
    await new Promise(resolve => {
      Promise.all(
        this.wrapper.children.map((child) => {
          if (child.disappear) return child.disappear()
          return Promise.resolve()
        })
      ).then(() => resolve())
    })
  }

  update () {
    const frequencies = Analyser.getFrequency()
    const delta = this.clock.getDelta()

    // Update animation mixer
    if (this.mixer) {
      this.mixer.update(delta)
    }

    // Rotate the whole visualization
    this.wrapper.rotation.z += 0.0075

    // Rotate the model independently
    if (this.model) {
      this.model.rotation.y += 0.01
    }

    this.wrapper.children.forEach((child, index) => {
      if (child.update && typeof child.update === 'function' && child.geometry) {
        child.update({
          frequency: frequencies[index]
        })
      }
    })
  }
}
