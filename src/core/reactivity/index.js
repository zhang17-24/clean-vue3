/**
 * Vue3 响应式系统核心实现
 * 
 * 这个文件实现了Vue3的响应式系统，包括：
 * 1. reactive：将普通对象转换为响应式对象
 * 2. effect：副作用函数，当响应式数据变化时自动执行
 * 
 * 核心原理：
 * - 使用Proxy拦截对象的get和set操作
 * - 使用依赖收集（track）和触发更新（trigger）机制
 */

// 当前正在执行的副作用函数（effect）
let activeEffect = null;

// 存储所有响应式对象和它们的依赖关系
// 结构：WeakMap { target: Map { key: Set<effect> } }
const targetMap = new WeakMap();

/**
 * 依赖收集函数
 * 当访问响应式对象的属性时，记录当前effect对该属性的依赖
 * 
 * @param {Object} target - 响应式对象
 * @param {string} key - 被访问的属性名
 */
function track(target, key) {
  // 如果当前没有正在执行的effect，直接返回
  if (!activeEffect) return;

  // 获取或创建target的依赖映射
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  // 获取或创建key对应的effect集合
  let deps = depsMap.get(key);
  if (!deps) {
    deps = new Set();
    depsMap.set(key, deps);
  }

  // 将当前effect添加到依赖集合中
  deps.add(activeEffect);
}

/**
 * 触发更新函数
 * 当响应式对象的属性被修改时，通知所有依赖该属性的effect重新执行
 * 
 * @param {Object} target - 响应式对象
 * @param {string} key - 被修改的属性名
 */
function trigger(target, key) {
  // 获取target的依赖映射
  const depsMap = targetMap.get(target);
  if (!depsMap) return;

  // 获取key对应的effect集合
  const deps = depsMap.get(key);
  if (!deps) return;

  // 执行所有依赖该属性的effect
  deps.forEach(effect => {
    effect();
  });
}

/**
 * 将普通对象转换为响应式对象
 * 
 * @param {Object} target - 要转换为响应式的对象
 * @returns {Proxy} 响应式代理对象
 */
export function reactive(target) {
  return new Proxy(target, {
    // 拦截属性的读取操作
    get(target, key, receiver) {
      // 收集依赖：当前effect依赖于这个属性
      track(target, key);
      
      // 返回属性值
      return Reflect.get(target, key, receiver);
    },
    
    // 拦截属性的设置操作
    set(target, key, value, receiver) {
      // 设置新值
      const result = Reflect.set(target, key, value, receiver);
      
      // 触发更新：通知所有依赖该属性的effect
      trigger(target, key);
      
      return result;
    }
  });
}

/**
 * 副作用函数
 * 当effect内部访问的响应式数据发生变化时，effect会自动重新执行
 * 
 * @param {Function} fn - 要执行的函数
 * @returns {Function} 返回effect函数本身，可以手动执行
 * 
 * 使用示例：
 * const state = reactive({ count: 0 });
 * effect(() => {
 *   console.log(state.count); // 当count变化时，这个函数会自动重新执行
 * });
 */
export function effect(fn) {
  // effect函数：包装用户传入的函数
  const effectFn = () => {
    // 保存之前的activeEffect
    const prevEffect = activeEffect;
    
    // 将当前effect设置为activeEffect
    activeEffect = effectFn;
    
    try {
      // 执行用户函数，在执行过程中会触发get操作，从而收集依赖
      fn();
    } finally {
      // 恢复之前的activeEffect
      activeEffect = prevEffect;
    }
  };
  
  // 立即执行一次，建立依赖关系
  effectFn();
  
  // 返回effect函数，可以手动调用
  return effectFn;
}

