import { Navigate } from "react-router-dom";
import { getUser } from "@/lib/auth";

const Index = () => {
  return <Navigate to={getUser() ? "/app/missions" : "/login"} replace />;
};

export default Index;
