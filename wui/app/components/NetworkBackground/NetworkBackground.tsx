import React, {
  useRef,
  useEffect,
  useCallback,
} from 'react'
import styles from './NetworkBackground.module.css'

interface NetworkBackgroundProps {
  numberOfNodes?: number // изначальное количество узлов в сети
  lineDistance?: number // максимальное расстояние для соединения двух точек линией
  dotColor?: string // базовый цвет точек
  lineColor?: string // базовый цвет соединительных линий
  baseDotSize?: number // базовый размер точки для узла с нулевыми соединениями
  sizeGrowthFactor?: number // насколько больше становится каждая точка за каждое соединение
  animationSpeed?: number // множитель скорости для скоростей частиц
  fpsLimit?: number // предел частоты кадров для производительности (например, 30 или 60)
  backgroundColor?: string // цвет фона холста (например, 'transparent' или '#000')
  enableClickToAdd?: boolean // может ли пользователь щелкнуть по фону, чтобы добавить новые точки
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
  dotColor = 'rgba(121, 157, 255, 0.16)',
  lineColor = 'rgba(141, 151, 255, 0.1)',
  baseDotSize = 4,
  sizeGrowthFactor = 0.3,
  animationSpeed = 1.0,
  fpsLimit = 60,
  backgroundColor = 'transparent',
  enableClickToAdd = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // хранит частицы в ref, чтобы не перерисовывать на каждом кадре анимации.
  const particlesRef = useRef<Particle[]>([])

  // хранит список смежности (для каждой частицы, с какими другими частицами она соединена?)
  const adjacencyRef = useRef<number[][]>([])

  // хранит идентификатор кадра, чтобы можно было отменить его при размонтировании.
  const frameIdRef = useRef<number>(0)
  const lastFrameTimeRef = useRef<number>(0)

  // хранит индексы частиц в сетке, чтобы можно было быстро найти ближайших соседей.
  const gridRef = useRef<Map<string, number[]>>(new Map())

  // каждая ячейка будет lineDistance×lineDistance, чтобы мы проверяли только локальных соседей.
  const cellSize = lineDistance

  // создает ключ из строки/столбца для идентификации ячейки сетки.
  const cellKey = (r: number, c: number) => `${r},${c}`

  // расстояние между двумя частицами.
  const getDistance = (p1: Particle, p2: Particle) => {
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  // инициализация частиц в рандомных позициях
  const initParticles = useCallback(
    (width: number, height: number) => {
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
    },
    [numberOfNodes, animationSpeed]
  )

  // создает сетку для быстрого поиска ближайших соседей.
  const buildSpatialGrid = (width: number, height: number) => {
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
  }

  // строит список смежности, сравнивая только локальные/близлежащие ячейки для каждой частицы.
  const buildAdjacency = useCallback((width: number, height: number) => {
    const n = particlesRef.current.length
    // сбросить список смежности
    adjacencyRef.current = Array.from({ length: n }, () => [])

    // создать сетку для быстрого поиска ближайших соседей
    buildSpatialGrid(width, height)

    // проверим каждую ячейку плюс ее 8 соседей
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

        // сравниваем каждую частицу в "indicesHere" с каждой в "indicesNeighbor"
        for (const i of indicesHere) {
          for (const j of indicesNeighbor) {
            // чтобы избежать повторений
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
  }, [lineDistance])

  // обновляет позиции частиц, отражаясь от краев в зависимости от размера каждой частицы (соседи -> больший радиус).
  const updateParticles = (width: number, height: number) => {
    const particles = particlesRef.current
    const adjacency = adjacencyRef.current

    for (let i = 0; i < particles.length; i++) {
      const neighborCount = adjacency[i]?.length || 0
      const radius = baseDotSize + sizeGrowthFactor * neighborCount
      const p = particles[i]

      // движение
      p.x += p.vx
      p.y += p.vy

      // отражение от левого и правого краев
      if (p.x - radius < 0) {
        p.x = radius
        p.vx = -p.vx
      } else if (p.x + radius > width) {
        p.x = width - radius
        p.vx = -p.vx
      }
      // отражение от верха и низа
      if (p.y - radius < 0) {
        p.y = radius
        p.vy = -p.vy
      } else if (p.y + radius > height) {
        p.y = height - radius
        p.vy = -p.vy
      }
    }
  }

  // рисует линии между соединенными частицами, затем сами частицы.
  const drawParticles = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    ctx.clearRect(0, 0, width, height)

    const particles = particlesRef.current
    const adjacency = adjacencyRef.current

    // Draw lines first
    for (let i = 0; i < particles.length; i++) {
      for (const j of adjacency[i]) {
        if (j > i) {
          ctx.beginPath()
          ctx.moveTo(particles[i].x, particles[i].y)
          ctx.lineTo(particles[j].x, particles[j].y)
          ctx.strokeStyle = lineColor
          ctx.lineWidth = 1
          ctx.stroke()
        }
      }
    }

    for (let i = 0; i < particles.length; i++) {
      const neighborCount = adjacency[i].length
      const radius = baseDotSize + sizeGrowthFactor * neighborCount

      ctx.beginPath()
      ctx.arc(particles[i].x, particles[i].y, radius, 0, Math.PI * 2)
      ctx.fillStyle = dotColor
      ctx.fill()
    }
  }

  // основной цикл анимации (с ограничением FPS)
  const animate = useCallback(
    (time: number) => {
      if (!canvasRef.current) return

      const ctx = canvasRef.current.getContext('2d')
      if (!ctx) return

      const width = canvasRef.current.width
      const height = canvasRef.current.height

      // FPS лимит
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
    [fpsLimit, buildAdjacency]
  )

  // обработчик клика для добавления новой частицы
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
      adjacencyRef.current.push([]) // new adjacency entry for the new particle
    },
    [enableClickToAdd, animationSpeed]
  )

  // инициализация и запуск анимации
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const rect = containerRef.current.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height
    canvas.style.backgroundColor = backgroundColor

    initParticles(rect.width, rect.height)
    frameIdRef.current = requestAnimationFrame(animate)

    // Observe container resizing
    const resizeObserver = new ResizeObserver(() => {
      const newRect = containerRef.current!.getBoundingClientRect()
      canvas.width = newRect.width
      canvas.height = newRect.height
      initParticles(newRect.width, newRect.height)
    })
    resizeObserver.observe(containerRef.current)

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
