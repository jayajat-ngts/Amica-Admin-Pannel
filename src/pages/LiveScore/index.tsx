import LiveScorePage from "../../components/live-score/LiveScorePage";
import PageMeta from "../../components/common/PageMeta";

export default function LiveScore() {
  return (
    <>
      <PageMeta 
        title="Live Score | Cricket Admin" 
        description="Watch live cricket match scores and updates in real-time"
      />
      <LiveScorePage />
    </>
  );
}
