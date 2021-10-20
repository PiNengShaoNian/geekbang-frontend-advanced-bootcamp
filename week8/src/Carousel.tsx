import { Component } from 'react'
import './Carousel.scss'

export class Carousel extends Component<{
  src: string[]
}> {
  private timer: number = -1
  private currentIndex = 0
  private nextIndex = 0
  private elements: HTMLElement[] = []
  private carouselContainer!: HTMLElement

  componentDidMount() {
    const { src } = this.props
    const elements = Array.from(
      this.carouselContainer.children
    ) as HTMLElement[]
    this.timer = setInterval(() => {
      this.nextIndex = (this.currentIndex + 1) % src.length
      const next = elements[this.nextIndex]
      const current = elements[this.currentIndex]

      next.style.transition = 'none'
      next.style.transform = `translateX(${100 - this.nextIndex * 100}%)`

      setTimeout(() => {
        next.style.transition = ''
        current.style.transform = `translateX(${
          -100 - this.currentIndex * 100
        }%)`
        next.style.transform = `translateX(${-this.nextIndex * 100}%)`

        this.currentIndex = this.nextIndex
      }, 16)
    }, 2000) as unknown as number
  }

  componentWillUnmount() {
    clearInterval(this.timer)
  }

  render() {
    const { src } = this.props
    return (
      <div
        className="carousel-container"
        ref={(v) => (this.carouselContainer = v!)}
      >
        {src.map((v) => (
          <div
            style={{
              height: '100%',
              minWidth: '100%',
              backgroundSize: '100% 100%',
              backgroundImage: `url('${v}')`,
            }}
            key={v}
          />
        ))}
      </div>
    )
  }
}
