import { Route, Switch } from "wouter";
import Home from "@/pages/Home";

export default function App() {
  return (
    <div className="min-h-screen bg-black">
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/:rest*">
          {() => (
            <div className="flex items-center justify-center min-h-screen text-white">
              <div className="text-center">
                <h1 className="text-4xl font-bold mb-4">404</h1>
                <p className="text-gray-400">Página no encontrada</p>
              </div>
            </div>
          )}
        </Route>
      </Switch>
    </div>
  );
}
