import React from "react"
import { useRef } from "react"
import { Button } from "@/atoms"

type FileInputProps = {
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

/**
 * Custom file input component that uses a label and button to trigger the file picker.
 */

const FileInput = ({ onChange, ...remainingProps }: FileInputProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden={true}
        onChange={onChange}
      />
      <Button
        style="outline"
        type="button"
        onClick={() => fileInputRef.current?.click()}
        {...remainingProps}
      >
        Upload
      </Button>
    </>
  )
}

export default FileInput
