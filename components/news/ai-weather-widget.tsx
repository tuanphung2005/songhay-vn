import { Skeleton } from "@/components/ui/boneyard-skeleton"

type AiWeatherWidgetProps = {
  loading?: boolean
}

export function AiWeatherWidget({ loading }: AiWeatherWidgetProps) {
  const weatherEmbedUrl =
    "https://radarthoitiet.com/widget/embed/ha-noi?style=1&day=5&td=%23003870&ntd=%23ff0000&mvb=%23959dad&mv=%23ff0000&mdk=%23dddddd&htd=true"

  return (
    <Skeleton name="ai-weather-widget" loading={loading}>
      <section className="p-0">
        <iframe
          src={weatherEmbedUrl}
          id="widgeturl"
          title="Widget thời tiết Hà Nội"
          width="100%"
          height="450"
          scrolling="no"
          frameBorder="0"
          loading="lazy"
          className="block w-full"
          style={{ border: "none", overflow: "hidden" }}
        />
      </section>
    </Skeleton>
  )
}
