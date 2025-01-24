"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"

export default function PWAInstall() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold text-center mb-2">Install Our App</h1>
        <p className="text-muted-foreground text-center mb-8">
          Get quick access to our services by installing our app on your device
        </p>

        <Tabs defaultValue="apple" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="apple">iOS</TabsTrigger>
            <TabsTrigger value="android">Android</TabsTrigger>
            <TabsTrigger value="desktop">Desktop</TabsTrigger>
          </TabsList>
          
          <TabsContent value="apple">
            <Card>
              <CardHeader>
                <CardTitle>Install on iOS</CardTitle>
                <CardDescription>Follow these steps to install on your iPhone or iPad</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="list-decimal list-inside space-y-4">
                  <li>Open Safari browser on your iOS device</li>
                  <li>Tap the Share button at the bottom of the browser</li>
                  <li>Scroll down and tap "Add to Home Screen"</li>
                  <li>Tap "Add" in the top right corner</li>
                </ol>
                <div className="rounded-lg overflow-hidden border">
                  <img 
                    src="/apple_instructions.jpg" 
                    alt="iOS Installation Instructions" 
                    className="w-full h-auto"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="android">
            <Card>
              <CardHeader>
                <CardTitle>Install on Android</CardTitle>
                <CardDescription>Follow these steps to install on your Android device</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="list-decimal list-inside space-y-4">
                  <li>Open Chrome browser on your Android device</li>
                  <li>Tap the three dots menu in the top right</li>
                  <li>Tap "Install app" or "Add to Home screen"</li>
                  <li>Follow the prompts to install</li>
                </ol>
                <div className="rounded-lg overflow-hidden border">
                  <img 
                    src="/android_instructions.jpg" 
                    alt="Android Installation Instructions" 
                    className="w-full h-auto"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="desktop">
            <Card>
              <CardHeader>
                <CardTitle>Install on Desktop</CardTitle>
                <CardDescription>Follow these steps to install on your computer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="list-decimal list-inside space-y-4">
                  <li>Open Chrome, Edge, or other supported browser</li>
                  <li>Look for the install icon in the address bar (usually a + or ⊕ symbol)</li>
                  <li>Click "Install" when prompted</li>
                  <li>The app will install and create a desktop shortcut</li>
                </ol>
                <div className="rounded-lg overflow-hidden border">
                  <img 
                    src="/desktop_instructions.jpg" 
                    alt="Desktop Installation Instructions" 
                    className="w-full h-auto"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
