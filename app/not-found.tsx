import Topbar from "@/components/Topbar"

const notFound = () => {
  return (
    <>
    <Topbar />
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <img src="/images/brokenDrone.png" alt="Not Found"className="w-128 h-128 mb-8" />
      <h1 className="text-3xl font-bold text-neutral-900 mb-2">Страница не найдена</h1>
      <p className="text-neutral-500 mb-8">К сожалению, запрашиваемая страница не существует.</p>
    </div>
    </>
  )
}

export default notFound