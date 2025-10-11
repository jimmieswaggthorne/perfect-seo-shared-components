"use client"
import { useEffect, useState } from "react"
import styles from './TypeWriterText.module.scss'
import { useIntersectionObserver } from 'usehooks-ts'

interface TypeWriterText {
  string: string;
  withBlink?: boolean;
  loop?: boolean;
  onIntersect?: boolean;
}
const TypeWriterText = ({ string, withBlink = true, loop = false, onIntersect = true }: TypeWriterText) => {
  const [text, setText] = useState(string)
  const [hiddenText, setHiddenText] = useState('')
  // only run when showing 
  const { isIntersecting, ref } = useIntersectionObserver({
    threshold: 0.5,
  })


  useEffect(() => {
    let speed = 60;
    let interval;
    let index = 0
    if (string && ((isIntersecting && onIntersect) || !onIntersect)) {
      interval = setInterval(() => {
        if (index < string.length) {
          index++
          setText(string.substring(0, index))
          setHiddenText(string.substring(index))
        }
        else {
          if (loop) {
            index = 0
          }
          else {
            clearInterval(interval)
          }
        }
      }, speed)
    }
    return () => {
      clearInterval(interval)
    }

  }, [string, loop, isIntersecting])


  return (
    <span className={styles.inherit} ref={ref}>
      {text}
      {withBlink &&
        <span className={styles.blink}>_</span>
      }
      <span className="hidden">{hiddenText}</span>
    </span>
  )
}

export default TypeWriterText