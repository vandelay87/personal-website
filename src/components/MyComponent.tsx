type MyComponentProps = {
  name: string
}

export default function MyComponent({ name }: MyComponentProps) {
  return (
    <div className="p-4 bg-blue-100 text-blue-700 rounded-lg">
      This is a custom component inside {name}!
    </div>
  )
}
