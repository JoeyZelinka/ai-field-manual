import Ride from "@/features/park/Ride";

export default function RidePage({ params }) {
  return <Ride id={params.id} />;
}