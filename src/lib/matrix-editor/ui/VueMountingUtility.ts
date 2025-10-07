/**
 * Vue Mounting Utility for Matrix Editor Integration
 * 
 * This utility allows mounting Vue components within TypeScript matrix editor components.
 * It handles the lifecycle management and cleanup of Vue app instances.
 */

import { createApp, App, Component as VueComponent } from 'vue'
import { createPinia } from 'pinia'

export interface VueMountOptions {
  /** The Vue component to mount */
  component: VueComponent
  /** Props to pass to the component */
  props?: Record<string, any>
  /** Whether to include Pinia store */
  withPinia?: boolean
  /** Custom app configuration */
  configureApp?: (app: App) => void
}

export class VueMountingUtility {
  private app: App | null = null
  private element: HTMLElement | null = null

  /**
   * Mount a Vue component in the specified DOM element
   * 
   * @param element The DOM element to mount the component to
   * @param options Vue mounting options
   * @returns Promise that resolves when component is mounted
   */
  async mount(element: HTMLElement, options: VueMountOptions): Promise<void> {
    if (this.app) {
      throw new Error('Component already mounted. Call unmount() first.')
    }

    this.element = element
    
    // Create Vue app instance
    this.app = createApp(options.component, options.props || {})

    // Add Pinia if requested (default: true for store compatibility)
    if (options.withPinia !== false) {
      this.app.use(createPinia())
    }

    // Apply custom app configuration
    if (options.configureApp) {
      options.configureApp(this.app)
    }

    // Mount the app
    this.app.mount(element)
    
    // Allow Vue to complete its mounting process
    await new Promise(resolve => setTimeout(resolve, 0))
  }

  /**
   * Unmount the Vue component and clean up
   */
  unmount(): void {
    if (this.app && this.element) {
      this.app.unmount()
      this.app = null
      
      // Clear the element content
      if (this.element.parentNode) {
        this.element.innerHTML = ''
      }
      this.element = null
    }
  }

  /**
   * Get the current Vue app instance
   */
  getApp(): App | null {
    return this.app
  }

  /**
   * Check if a component is currently mounted
   */
  isMounted(): boolean {
    return this.app !== null
  }

  /**
   * Update component props (if the component supports reactive props)
   */
  updateProps(newProps: Record<string, any>): void {
    if (!this.app) {
      throw new Error('No component mounted')
    }
    
    // Note: Direct prop updates are not straightforward in Vue 3
    // This would require the component to be designed with reactive props
    // or using provide/inject pattern for communication
    console.warn('Direct prop updates not implemented. Consider using reactive communication patterns.')
  }

  /**
   * Static helper to quickly mount a component
   */
  static async quickMount(
    element: HTMLElement, 
    component: VueComponent, 
    props?: Record<string, any>
  ): Promise<VueMountingUtility> {
    const utility = new VueMountingUtility()
    await utility.mount(element, { component, props })
    return utility
  }
}

/**
 * Global registry for Vue mounting utilities to prevent memory leaks
 */
class VueMountingRegistry {
  private utilities: Set<VueMountingUtility> = new Set()

  register(utility: VueMountingUtility): void {
    this.utilities.add(utility)
  }

  unregister(utility: VueMountingUtility): void {
    this.utilities.delete(utility)
  }

  cleanup(): void {
    this.utilities.forEach(utility => {
      try {
        utility.unmount()
      } catch (error) {
        console.error('Error during Vue utility cleanup:', error)
      }
    })
    this.utilities.clear()
  }

  size(): number {
    return this.utilities.size
  }
}

// Export singleton registry
export const vueMountingRegistry = new VueMountingRegistry()

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    vueMountingRegistry.cleanup()
  })
}
