import classNames from 'classnames'
import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react'
import { bezierCommand, Point } from './utils'
import styles from './DrawingBoard.module.scss'
import { parse, stringify } from 'transform-parser'

export type DrawingElement = SVGPathElement | SVGRectElement | SVGEllipseElement

export interface DrawingPath {
  element: DrawingElement
  points: Point[]
}

export interface DrawingBoardRef {
  getSelectedElement(): DrawingElement | undefined
  insertElement(element: DrawingElement): void
  deleteElement(element: DrawingElement): void
  clear(): void
  exportAsSvg(): File
}

export type DrawingBoardMode = 'path' | 'rect' | 'ellipse' | 'circle'

export interface DrawingBoardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  viewBox?: string
  mode?: DrawingBoardMode
  strokeColor?: string
  strokeWidth?: number
}

export const DrawingBoard = forwardRef<DrawingBoardRef, DrawingBoardProps>(
  (
    {
      className,
      viewBox = '0 0 500 500',
      mode = 'path',
      strokeColor = '#000000',
      strokeWidth = 5,
      ...props
    },
    ref,
  ) => {
    const drawAreaRef = useRef<SVGSVGElement>(null)
    const drawingPathRef = useRef<DrawingPath>()
    const selectedElementRef = useRef<DrawingElement>()
    const draggingElementRef = useRef<DrawingElement>()

    useImperativeHandle(ref, () => {
      return {
        getSelectedElement: () => selectedElementRef.current,
        insertElement: element => {
          drawAreaRef.current!.appendChild(element)
        },
        deleteElement: element => {
          drawAreaRef.current!.removeChild(element)
        },
        clear: () => {
          drawAreaRef.current!.innerHTML = ''
        },
        exportAsSvg: () => {
          const content = drawAreaRef.current!.outerHTML

          return new File([content], 'exported.svg', { type: 'image/svg+xml' })
        },
      }
    })

    const handlePointerDown: React.PointerEventHandler = event => {
      if (event.button !== 0) {
        return
      }

      const boundingRect = drawAreaRef.current!.getBoundingClientRect()
      const point = {
        x: event.clientX - boundingRect.left,
        y: event.clientY - boundingRect.top,
      }

      document
        .querySelectorAll(`.${styles.selected}`)
        .forEach(element => element.classList.remove(styles.selected))

      delete selectedElementRef.current

      if (
        event.target instanceof SVGPathElement ||
        event.target instanceof SVGRectElement ||
        event.target instanceof SVGEllipseElement
      ) {
        event.target.classList.add(styles.selected)

        selectedElementRef.current = event.target
        draggingElementRef.current = event.target

        return
      }

      const element = (() => {
        switch (mode) {
          case 'path':
            return document.createElementNS(
              'http://www.w3.org/2000/svg',
              'path',
            )
          case 'rect':
            return document.createElementNS(
              'http://www.w3.org/2000/svg',
              'rect',
            )
          case 'ellipse':
          case 'circle':
            return document.createElementNS(
              'http://www.w3.org/2000/svg',
              'ellipse',
            )
        }
      })()

      element.style.stroke = strokeColor
      element.style.strokeWidth = `${strokeWidth}px`
      element.style.strokeLinecap = 'round'
      element.style.fill = 'none'

      drawingPathRef.current = {
        element,
        points: [point],
      }

      drawAreaRef.current!.appendChild(element)
    }

    const handlePointerUp: React.PointerEventHandler = () => {
      delete drawingPathRef.current
      delete draggingElementRef.current
    }

    const handlePointerMove: React.PointerEventHandler = event => {
      const boundingRect = drawAreaRef.current!.getBoundingClientRect()
      const point = {
        x: event.clientX - boundingRect.left,
        y: event.clientY - boundingRect.top,
      }

      if (draggingElementRef.current) {
        const element = draggingElementRef.current

        const dx = event.movementX
        const dy = event.movementY

        const transform = element.getAttribute('transform')
        const transformObj = transform ? parse(transform) : {}

        if (Array.isArray(transformObj.translate)) {
          const [pdx, pdy] = transformObj.translate

          const ndx = Number(pdx) + dx
          const ndy = Number(pdy) + dy

          transformObj.translate = [ndx, ndy]
        } else {
          transformObj.translate = [dx, dy]
        }

        element.setAttribute(
          'transform',
          stringify(transformObj).replace(/px/g, ''),
        )

        return
      }

      if (!drawingPathRef.current) {
        return
      }

      const { element, points } = drawingPathRef.current

      points.push(point)

      switch (mode) {
        case 'path': {
          element.setAttribute(
            'd',
            points.reduce(
              (acc, point, i, a) =>
                i === 0
                  ? `M ${point.x},${point.y}`
                  : `${acc} ${bezierCommand(point, i, a)}`,
              '',
            ),
          )

          break
        }
        case 'rect': {
          const start = points[0]
          const end = point

          element.setAttribute('x', `${Math.min(start.x, end.x)}`)
          element.setAttribute('y', `${Math.min(start.y, end.y)}`)
          element.setAttribute('width', `${Math.abs(end.x - start.x)}`)
          element.setAttribute('height', `${Math.abs(end.y - start.y)}`)

          break
        }
        case 'ellipse': {
          const start = points[0]
          const end = point
          const rx = Math.abs(end.x - start.x) / 2
          const ry = Math.abs(end.y - start.y) / 2

          element.setAttribute('cx', `${Math.min(start.x, end.x) + rx}`)
          element.setAttribute('cy', `${Math.min(start.y, end.y) + ry}`)
          element.setAttribute('rx', `${rx}`)
          element.setAttribute('ry', `${ry}`)

          break
        }
        case 'circle': {
          const start = points[0]
          const end = point
          const rx = Math.abs(end.x - start.x) / 2
          const ry = Math.abs(end.y - start.y) / 2
          const radius = Math.max(rx, ry)

          element.setAttribute('cx', `${Math.min(start.x, end.x) + radius}`)
          element.setAttribute('cy', `${Math.min(start.y, end.y) + radius}`)
          element.setAttribute('rx', `${radius}`)
          element.setAttribute('ry', `${radius}`)

          break
        }
      }
    }

    useLayoutEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        switch (event.key) {
          case 'Backspace': {
            const element = selectedElementRef.current

            if (element) {
              drawAreaRef.current!.removeChild(element)
            }

            break
          }
          case '=': {
            const element = selectedElementRef.current

            if (element) {
              const transform = element.getAttribute('transform')
              const transformObj = transform ? parse(transform) : {}

              if (typeof transformObj.scale === 'number') {
                transformObj.scale = transformObj.scale + 0.1
              } else {
                transformObj.scale = 1.1
              }

              element.setAttribute(
                'transform',
                stringify(transformObj).replace(/px/g, ''),
              )
            }

            break
          }
          case '-': {
            const element = selectedElementRef.current

            if (element) {
              const transform = element.getAttribute('transform')
              const transformObj = transform ? parse(transform) : {}

              if (typeof transformObj.scale === 'number') {
                transformObj.scale = transformObj.scale - 0.1
              } else {
                transformObj.scale = 0.9
              }

              element.setAttribute(
                'transform',
                stringify(transformObj).replace(/px/g, ''),
              )
            }

            break
          }
          default:
        }
      }

      document.addEventListener('keydown', handleKeyDown)

      return () => {
        document.removeEventListener('keydown', handleKeyDown)
      }
    }, [])

    return (
      <div
        className={classNames(styles.board, className)}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        {...props}
      >
        {useMemo(
          () => (
            <svg
              ref={drawAreaRef}
              xmlns="http://www.w3.org/2000/svg"
              viewBox={viewBox}
            />
          ),
          [viewBox],
        )}
      </div>
    )
  },
)
