import React, {
  useRef,
  useEffect,
  useCallback,
} from 'react'
import styles from './NetworkBackground.module.css'

interface NetworkBackgroundProps {
  numberOfNodes?: number // начальное количество узлов
  lineDistance?: number  // максимальное расстояние для линии
  dotColor?: string      // цвет точек
  lineColor?: string     // цвет линий
  baseDotSize?: number   // базовый радиус точки
  sizeGrowthFactor?: number  // рост радиуса за счёт соседей
  animationSpeed?: number    // множитель скорости анимации
  fpsLimit?: number          // ограничение FPS
  backgroundColor?: string   // цвет фона холста
  enableClickToAdd?: boolean // добавлять ли точки по клику
  maxParticles?: number      // максимальное число точек (для автоудаления старых)
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
}

const NetworkBackground: React.FC<NetworkBackgroundProps> = ({
  numberOfNodes = 25,
  lineDistance = 130,
  dotColor = 'rgba(138, 206, 229, 0.05)',
  lineColor = 'rgba(128, 203, 228, 0.07)',
  baseDotSize = 4,
  sizeGrowthFactor = 0.3,
  animationSpeed = 1.0,
  fpsLimit = 60,
  backgroundColor = 'transparent',
  enableClickToAdd = true,
  maxParticles = Infinity, // по умолчанию не ограничиваем
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Основные структуры данных
  const particlesRef = useRef<Particle[]>([])
  const adjacencyRef = useRef<number[][]>([])
  const frameIdRef = useRef<number>(0)
  const lastFrameTimeRef = useRef<number>(0)

  const gridRef = useRef<Map<string, number[]>>(new Map())
  const cellSize = lineDistance
  const cellKey = useCallback((r: number, c: number) => `${r},${c}`, [])

  const getDistance = (p1: Particle, p2: Particle) => {
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  // Инициализация начальных точек
  const initParticles = useCallback((width: number, height: number) => {
    const particles: Particle[] = []
    for (let i = 0; i < numberOfNodes; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5 * animationSpeed,
        vy: (Math.random() - 0.5) * 0.5 * animationSpeed,
      })
    }
    particlesRef.current = particles
    adjacencyRef.current = Array.from({ length: particles.length }, () => [])
  }, [numberOfNodes, animationSpeed])

  // Построение сетки для ускорения поиска соседей
  const buildSpatialGrid = useCallback((width: number, height: number) => {
    gridRef.current.clear()
    const particles = particlesRef.current
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]
      const row = Math.floor(p.y / cellSize)
      const col = Math.floor(p.x / cellSize)
      const key = cellKey(row, col)
      if (!gridRef.current.has(key)) {
        gridRef.current.set(key, [])
      }
      gridRef.current.get(key)?.push(i)
    }
  }, [cellSize, cellKey])

  // Сбор списка смежности на основе сетки
  const buildAdjacency = useCallback((width: number, height: number) => {
    const n = particlesRef.current.length
    adjacencyRef.current = Array.from({ length: n }, () => [])

    buildSpatialGrid(width, height)

    const neighborOffsets = [
      [0, 0],
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ]

    const visitedPairs = new Set<string>()
    const cellKeys = Array.from(gridRef.current.keys())

    for (const cell of cellKeys) {
      const [r, c] = cell.split(',').map(Number)
      const indicesHere = gridRef.current.get(cell) ?? []

      for (const [dr, dc] of neighborOffsets) {
        const neighborKey = cellKey(r + dr, c + dc)
        if (!gridRef.current.has(neighborKey)) continue
        const indicesNeighbor = gridRef.current.get(neighborKey) ?? []

        for (const i of indicesHere) {
          for (const j of indicesNeighbor) {
            if (j <= i) continue
            const pairKey = `${i}-${j}`
            if (visitedPairs.has(pairKey)) continue
            visitedPairs.add(pairKey)

            const p1 = particlesRef.current[i]
            const p2 = particlesRef.current[j]
            if (getDistance(p1, p2) < lineDistance) {
              adjacencyRef.current[i].push(j)
              adjacencyRef.current[j].push(i)
            }
          }
        }
      }
    }
  }, [lineDistance, buildSpatialGrid, cellKey])

  // Обновление позиций
  const updateParticles = useCallback((width: number, height: number) => {
    const particles = particlesRef.current
    const adjacency = adjacencyRef.current

    for (let i = 0; i < particles.length; i++) {
      const neighborCount = adjacency[i]?.length || 0
      const radius = baseDotSize + sizeGrowthFactor * neighborCount
      const p = particles[i]

      p.x += p.vx
      p.y += p.vy

      // Отражение от краёв
      if (p.x - radius < 0) {
        p.x = radius
        p.vx = -p.vx
      } else if (p.x + radius > width) {
        p.x = width - radius
        p.vx = -p.vx
      }
      if (p.y - radius < 0) {
        p.y = radius
        p.vy = -p.vy
      } else if (p.y + radius > height) {
        p.y = height - radius
        p.vy = -p.vy
      }
    }
  }, [baseDotSize, sizeGrowthFactor])

  // Рисование линий и частиц
  const drawParticles = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number
    ) => {
      ctx.clearRect(0, 0, width, height)

      const particles = particlesRef.current
      const adjacency = adjacencyRef.current

      // Линии
      ctx.lineWidth = 1
      ctx.strokeStyle = lineColor

      for (let i = 0; i < particles.length; i++) {
        for (const j of adjacency[i]) {
          // Чтобы не рисовать пару дважды
          if (j > i) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }

      // Точки
      for (let i = 0; i < particles.length; i++) {
        const neighborCount = adjacency[i].length
        const radius = baseDotSize + sizeGrowthFactor * neighborCount

        ctx.beginPath()
        ctx.arc(particles[i].x, particles[i].y, radius, 0, Math.PI * 2)
        ctx.fillStyle = dotColor
        ctx.fill()
      }
    },
    [lineColor, dotColor, baseDotSize, sizeGrowthFactor]
  )

  // Анимационный цикл с учётом лимита FPS
  const animate = useCallback(
    (time: number) => {
      if (!canvasRef.current) return
      const ctx = canvasRef.current.getContext('2d')
      if (!ctx) return

      const { width, height } = canvasRef.current

      // Ограничение FPS
      const delta = time - lastFrameTimeRef.current
      const interval = 1000 / fpsLimit
      if (delta < interval) {
        frameIdRef.current = requestAnimationFrame(animate)
        return
      }
      lastFrameTimeRef.current = time

      buildAdjacency(width, height)
      drawParticles(ctx, width, height)
      updateParticles(width, height)

      frameIdRef.current = requestAnimationFrame(animate)
    },
    [fpsLimit, buildAdjacency, drawParticles, updateParticles]
  )

  // Добавление новой частицы по клику
  const handleClick = useCallback(
    (e: MouseEvent) => {
      if (!enableClickToAdd || !canvasRef.current) return

      const rect = canvasRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 0.5 * animationSpeed,
        vy: (Math.random() - 0.5) * 0.5 * animationSpeed,
      })
      adjacencyRef.current.push([]) // добавляем пустой список смежности

      // Если превышаем maxParticles, удаляем самую старую
      if (particlesRef.current.length > maxParticles) {
        // Удаляем из начала
        particlesRef.current.shift()
        adjacencyRef.current.shift()

        // Нужно сдвинуть индексы во всех списках смежности
        adjacencyRef.current.forEach(adjList => {
          for (let i = adjList.length - 1; i >= 0; i--) {
            if (adjList[i] === 0) {
              adjList.splice(i, 1)
            } else if (adjList[i] > 0) {
              adjList[i] = adjList[i] - 1
            }
          }
        })
      }
    },
    [enableClickToAdd, animationSpeed, maxParticles]
  )

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const rect = containerRef.current.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height
    canvas.style.backgroundColor = backgroundColor

    // Инициализируем набор точек один раз
    initParticles(rect.width, rect.height)

    // Запускаем анимацию
    frameIdRef.current = requestAnimationFrame(animate)

    // Ресайз-обсервер: меняем размеры холста без пересоздания всех точек
    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current || !canvasRef.current) return
      const newRect = containerRef.current.getBoundingClientRect()

      // Запоминаем старые размеры, чтобы при желании масштабировать точки
      const oldWidth = canvas.width
      const oldHeight = canvas.height

      canvas.width = newRect.width
      canvas.height = newRect.height

      // Пример: если хотим «масштабировать» старые координаты
      if (oldWidth > 0 && oldHeight > 0) {
        const scaleX = newRect.width / oldWidth
        const scaleY = newRect.height / oldHeight

        particlesRef.current.forEach(p => {
          p.x *= scaleX
          p.y *= scaleY
        })
      }
    })
    resizeObserver.observe(containerRef.current)

    // Обработчик клика
    window.addEventListener('click', handleClick)

    return () => {
      cancelAnimationFrame(frameIdRef.current)
      resizeObserver.disconnect()
      window.removeEventListener('click', handleClick)
    }
  }, [animate, handleClick, initParticles, backgroundColor])

  return (
    <div ref={containerRef} className={styles.container}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  )
}

export default NetworkBackground
