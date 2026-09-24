import { Celebration } from './components/Celebration'
import { CookieBanner } from './components/CookieBanner'
import { match, useRoute } from './router'
import { Home } from './screens/Home'
import { Progress } from './screens/Progress'
import { ScoreFlow } from './screens/ScoreFlow'
import { TakeView } from './screens/TakeView'
import { NotFound, TapeDetail } from './screens/TapeDetail'
import { TapeForm } from './screens/TapeForm'

function Screen({ path }: { path: string }) {
  let m
  if (path === '/') return <Home />
  if (path === '/progress') return <Progress />
  if (path === '/tape/new') return <TapeForm />
  if ((m = match('/tape/:id/edit', path))) return <TapeForm id={m.id} />
  if ((m = match('/tape/:id/take/new', path))) return <ScoreFlow key={m.id} tapeId={m.id} />
  if ((m = match('/tape/:id/take/:takeId', path))) return <TakeView tapeId={m.id} takeId={m.takeId} />
  if ((m = match('/tape/:id', path))) return <TapeDetail id={m.id} />
  return <NotFound />
}

export default function App() {
  const path = useRoute()
  return (
    <>
      <Screen path={path} />
      <Celebration />
      <CookieBanner />
    </>
  )
}
