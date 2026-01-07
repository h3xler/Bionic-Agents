import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { trpc } from "@/lib/trpc";
import { Loader2, Rocket, Save, TestTube } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";

// Google Gemini models for LiveKit realtime audio
const GEMINI_MODELS = [
  { value: "gemini-2.5-flash-native-audio-preview-09-2025", label: "Gemini 2.5 Flash Native Audio (Recommended)", hasVision: true },
  { value: "gemini-2.0-flash-exp", label: "Gemini 2.0 Flash Exp", hasVision: true },
  { value: "gemini-2.0-flash-live-001", label: "Gemini 2.0 Flash Live", hasVision: true },
  { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash", hasVision: false },
  { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro", hasVision: false },
];

export default function AgentConfig() {
  const [, params] = useRoute("/agents/:id");
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const isNew = params?.id === "new";
  const agentId = isNew ? null : parseInt(params?.id || "0");

  const { data: agent, isLoading } = trpc.agents.get.useQuery(
    { id: agentId! },
    { enabled: !isNew && !!agentId }
  );

  const createAgent = trpc.agents.create.useMutation({
    onSuccess: (data) => {
      toast.success("Agent created successfully");
      navigate(`/agents/${data.id}`);
    },
    onError: (error) => {
      toast.error(`Failed to create agent: ${error.message}`);
    },
  });

  const updateAgent = trpc.agents.update.useMutation({
    onSuccess: () => {
      toast.success("Agent updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update agent: ${error.message}`);
    },
  });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sttProvider: "google",
    ttsProvider: "google",
    voiceId: "",
    llmProvider: "gemini",
    llmModel: "gemini-2.5-flash-native-audio-preview-09-2025",
    visionEnabled: false,
    screenShareEnabled: false,
    transcribeEnabled: false,
    languages: "tr",
    avatarModel: "",
    systemPrompt: "You are a helpful AI assistant.",
    initialGreeting: "",
    temperature: 0.6,
    mcpGatewayUrl: "",
  });

  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name,
        description: agent.description || "",
        sttProvider: agent.sttProvider || "google",
        ttsProvider: agent.ttsProvider || "google",
        voiceId: agent.voiceId || "",
        llmProvider: agent.llmProvider || "gemini",
        llmModel: agent.llmModel || "gemini-2.5-flash-native-audio-preview-09-2025",
        visionEnabled: agent.visionEnabled === 1,
        screenShareEnabled: agent.screenShareEnabled === 1,
        transcribeEnabled: agent.transcribeEnabled === 1,
        languages: agent.languages || "tr",
        avatarModel: agent.avatarModel || "",
        systemPrompt: agent.systemPrompt || "You are a helpful AI assistant.",
        initialGreeting: (agent as any).initial_greeting || (agent as any).initialGreeting || "",
        temperature: (agent as any).temperature || 0.6,
        mcpGatewayUrl: agent.mcpGatewayUrl || "",
      });
    }
  }, [agent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      visionEnabled: formData.visionEnabled ? 1 : 0,
      screenShareEnabled: formData.screenShareEnabled ? 1 : 0,
      transcribeEnabled: formData.transcribeEnabled ? 1 : 0,
    };

    if (isNew) {
      await createAgent.mutateAsync(payload);
    } else if (agentId) {
      await updateAgent.mutateAsync({ id: agentId, ...payload });
    }
  };

  // Get info about selected model
  const selectedModel = GEMINI_MODELS.find(m => m.value === formData.llmModel);

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">
            {isNew ? "Create New Agent" : "Configure Agent"}
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure your LiveKit agent with Google Gemini
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Name and describe your agent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Agent Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="My Voice Agent"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="A helpful voice assistant for customer support"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* LLM Configuration - Simplified for Google Gemini */}
          <Card>
            <CardHeader>
              <CardTitle>Language Model (LLM)</CardTitle>
              <CardDescription>Select the Google Gemini model for your agent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="llmModel">Model *</Label>
                <Select
                  value={formData.llmModel}
                  onValueChange={(value) => setFormData({ ...formData, llmModel: value })}
                >
                  <SelectTrigger id="llmModel">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {GEMINI_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label} {model.hasVision ? "👁️" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedModel && !selectedModel.hasVision && formData.visionEnabled && (
                  <p className="text-sm text-yellow-600">
                    ⚠️ This model doesn't support vision. Vision will be disabled.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="voiceId">Voice (Gemini Voices)</Label>
                <Select
                  value={formData.voiceId || "Zephyr"}
                  onValueChange={(value) => setFormData({ ...formData, voiceId: value })}
                >
                  <SelectTrigger id="voiceId">
                    <SelectValue placeholder="Select a voice" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Zephyr">Zephyr (Calm, Male)</SelectItem>
                    <SelectItem value="Puck">Puck (Energetic, Male)</SelectItem>
                    <SelectItem value="Charon">Charon (Serious, Male)</SelectItem>
                    <SelectItem value="Kore">Kore (Friendly, Female)</SelectItem>
                    <SelectItem value="Fenrir">Fenrir (Deep, Male)</SelectItem>
                    <SelectItem value="Aoede">Aoede (Warm, Female)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="temperature">
                  Temperature: {formData.temperature.toFixed(1)}
                </Label>
                <Slider
                  id="temperature"
                  value={[formData.temperature]}
                  onValueChange={([value]) => setFormData({ ...formData, temperature: value })}
                  min={0}
                  max={1}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Lower = more focused, Higher = more creative
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="systemPrompt">System Prompt / Persona</Label>
                <Textarea
                  id="systemPrompt"
                  value={formData.systemPrompt}
                  onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                  rows={6}
                  placeholder="You are a helpful AI assistant..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="initialGreeting">Initial Greeting</Label>
                <Textarea
                  id="initialGreeting"
                  value={formData.initialGreeting}
                  onChange={(e) => setFormData({ ...formData, initialGreeting: e.target.value })}
                  rows={2}
                  placeholder="Hello! I'm your AI assistant. How can I help you today?"
                />
                <p className="text-xs text-muted-foreground">
                  Agent will say this when joining a room
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
              <CardDescription>Enable additional capabilities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Vision (Camera Input)</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable visual understanding from camera
                  </p>
                </div>
                <Switch
                  checked={formData.visionEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, visionEnabled: checked })}
                  disabled={selectedModel && !selectedModel.hasVision}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Screen Share</Label>
                  <p className="text-sm text-muted-foreground">
                    Analyze screen sharing content
                  </p>
                </div>
                <Switch
                  checked={formData.screenShareEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, screenShareEnabled: checked })}
                  disabled={selectedModel && !selectedModel.hasVision}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Transcription</Label>
                  <p className="text-sm text-muted-foreground">
                    Record and transcribe conversations (via LiveKit Egress)
                  </p>
                </div>
                <Switch
                  checked={formData.transcribeEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, transcribeEnabled: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Localization & Avatar */}
          <Card>
            <CardHeader>
              <CardTitle>Localization & Avatar</CardTitle>
              <CardDescription>Language and visual settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="languages">Languages (comma-separated)</Label>
                <Input
                  id="languages"
                  value={formData.languages}
                  onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                  placeholder="tr, en"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avatarModel">Avatar Model (BitHuman)</Label>
                <Input
                  id="avatarModel"
                  value={formData.avatarModel}
                  onChange={(e) => setFormData({ ...formData, avatarModel: e.target.value })}
                  placeholder="model-name"
                />
              </div>
            </CardContent>
          </Card>

          {/* MCP Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>MCP Gateway</CardTitle>
              <CardDescription>Model Context Protocol integration (e.g., n8n)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mcpGatewayUrl">MCP Gateway URL</Label>
                <Input
                  id="mcpGatewayUrl"
                  value={formData.mcpGatewayUrl}
                  onChange={(e) => setFormData({ ...formData, mcpGatewayUrl: e.target.value })}
                  placeholder="https://your-n8n-instance.com/mcp"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={createAgent.isPending || updateAgent.isPending}
              className="flex-1"
            >
              {(createAgent.isPending || updateAgent.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              <Save className="h-4 w-4 mr-2" />
              {isNew ? "Create Agent" : "Save Changes"}
            </Button>
            {!isNew && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/agents/${agentId}/test`)}
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  Test
                </Button>
                <Button
                  type="button"
                  variant="default"
                  onClick={() => navigate(`/agents/${agentId}/deploy`)}
                >
                  <Rocket className="h-4 w-4 mr-2" />
                  Deploy
                </Button>
              </>
            )}
            <Button type="button" variant="outline" onClick={() => navigate("/")}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
