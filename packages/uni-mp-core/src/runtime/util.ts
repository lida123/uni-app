import { hasOwn, isArray } from '@vue/shared'
import {
  ComponentOptions,
  ComponentInternalInstance,
  ComponentPublicInstance,
} from 'vue'

import { MPComponentInstance, MPComponentOptions } from './component'

export function initBehavior(options: any) {
  return Behavior(options)
}

export function initVueIds(
  vueIds: string | undefined,
  mpInstance: MPComponentInstance
) {
  if (!vueIds) {
    return
  }
  const ids = vueIds.split(',')
  const len = ids.length

  if (len === 1) {
    mpInstance._$vueId = ids[0]
  } else if (len === 2) {
    mpInstance._$vueId = ids[0]
    mpInstance._$vuePid = ids[1]
  }
}

const EXTRAS = ['externalClasses']

export function initExtraOptions(
  miniProgramComponentOptions: MPComponentOptions,
  vueOptions: ComponentOptions
) {
  EXTRAS.forEach((name) => {
    if (hasOwn(vueOptions, name)) {
      ;(miniProgramComponentOptions as any)[name] = vueOptions[name]
    }
  })
}

export function initWxsCallMethods(
  methods: WechatMiniprogram.Component.MethodOption,
  wxsCallMethods: WechatMiniprogram.Component.MethodOption
) {
  if (!isArray(wxsCallMethods)) {
    return
  }
  wxsCallMethods.forEach((callMethod: string) => {
    methods[callMethod] = function (this: MPComponentInstance, args: unknown) {
      return (this.$vm as any)[callMethod](args)
    }
  })
}

export function initRefs(
  instance: ComponentInternalInstance,
  mpInstance: MPComponentInstance
) {
  Object.defineProperty(instance, 'refs', {
    get() {
      const $refs: Record<string, any> = {}
      const components = mpInstance.selectAllComponents('.vue-ref')
      components.forEach((component) => {
        const ref = component.dataset.ref
        $refs[ref] = component.$vm || component
      })
      const forComponents = mpInstance.selectAllComponents('.vue-ref-in-for')
      forComponents.forEach((component) => {
        const ref = component.dataset.ref
        if (!$refs[ref]) {
          $refs[ref] = []
        }
        $refs[ref].push(component.$vm || component)
      })
      return $refs
    },
  })
}

export function findVmByVueId(
  instance: ComponentPublicInstance,
  vuePid: string
): ComponentPublicInstance | undefined {
  // TODO vue3 中 没有 $children
  const $children = (instance as any).$children
  // 优先查找直属(反向查找:https://github.com/dcloudio/uni-app/issues/1200)
  for (let i = $children.length - 1; i >= 0; i--) {
    const childVm = $children[i]
    if (childVm.$scope._$vueId === vuePid) {
      return childVm
    }
  }
  // 反向递归查找
  let parentVm
  for (let i = $children.length - 1; i >= 0; i--) {
    parentVm = findVmByVueId($children[i], vuePid)
    if (parentVm) {
      return parentVm
    }
  }
}
