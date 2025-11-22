import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Rooms from "./pages/Rooms";
import Sessions from "./pages/Sessions";
import SessionDetail from "./pages/SessionDetail";
import ParticipantSessionDetail from "./pages/ParticipantSessionDetail";
import TrackDetail from "./pages/TrackDetail";
import Agents from "./pages/Agents";
import AgentDetail from "./pages/AgentDetail";
import AgentSessionDetail from "./pages/AgentSessionDetail";
import Tenants from "./pages/Tenants";
import TenantDetail from "./pages/TenantDetail";
import Runtime from "./pages/Runtime";
import Costs from "./pages/Costs";
import Settings from "./pages/Settings";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/rooms" component={Rooms} />
      <Route path="/rooms/:id" component={SessionDetail} />
      <Route path="/sessions" component={Sessions} />
      <Route path="/sessions/:id" component={ParticipantSessionDetail} />
      <Route path="/tracks/:id" component={TrackDetail} />
      <Route path="/agents" component={Agents} />
      <Route path="/agents/:id" component={AgentDetail} />
      <Route path="/agent-sessions/:sessionId" component={AgentSessionDetail} />
      <Route path="/tenants" component={Tenants} />
      <Route path="/tenants/:tenantId" component={TenantDetail} />
      <Route path="/runtime" component={Runtime} />
      <Route path="/costs" component={Costs} />
      <Route path="/settings" component={Settings} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
