import Button from '@components/Button'

export default function Home() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Home Page</h1>
      <p>Welcome to my personal website!</p>
      <Button onClick={() => alert('click')}>Click me!</Button>
      <Button onClick={() => alert('click')} disabled>
        Click me!
      </Button>
      <Button onClick={() => console.log('click')} variant="secondary">
        Click me!
      </Button>
      <Button onClick={() => console.log('click')} ariaLabel="alert">
        ⚠️
      </Button>
    </div>
  )
}
