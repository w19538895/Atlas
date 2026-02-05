"use client";

import React from "react"

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Camera,
  Upload,
  MapPin,
  Landmark,
  Star,
  Lightbulb,
  MessageCircle,
  Bookmark,
  Share2,
  X,
  Loader2,
  ImageIcon,
} from "lucide-react";

interface AnalysisResult {
  name: string;
  location: string;
  country: string;
  imageUrl: string;
  historicalFacts: string[];
  interestingDetails: string[];
  travelTips: string[];
}

const mockAnalysis: AnalysisResult = {
  name: "Eiffel Tower",
  location: "Champ de Mars, Paris",
  country: "France",
  imageUrl: "https://images.unsplash.com/photo-1511739001486-6bfe10ce65f4?w=800&h=600&fit=crop",
  historicalFacts: [
    "Built between 1887-1889 for the 1889 World's Fair",
    "Named after engineer Gustave Eiffel, whose company designed the structure",
    "Was the world's tallest man-made structure for 41 years",
    "Originally intended to be dismantled after 20 years",
  ],
  interestingDetails: [
    "The tower is 330 meters tall, including antennas",
    "It contains 18,000 metallic parts and 2.5 million rivets",
    "The tower was painted brown at first, not its current bronze color",
    "It grows up to 15 cm taller during hot summer days due to thermal expansion",
  ],
  travelTips: [
    "Book tickets online in advance to avoid long queues",
    "Visit at sunset for the best photo opportunities",
    "The second floor offers the best views for most visitors",
    "Try the restaurants on the tower for a unique dining experience",
  ],
};

export function VisionTab() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      processImage(file);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  const processImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
      analyzeImage();
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    // Simulate API call
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisResult(mockAnalysis);
    }, 2500);
  };

  const resetUpload = () => {
    setUploadedImage(null);
    setAnalysisResult(null);
    setIsAnalyzing(false);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Landmark Recognition</h2>
        <p className="text-muted-foreground">
          Upload a photo or use your camera to identify landmarks
        </p>
      </div>

      {!uploadedImage ? (
        /* Upload Zone */
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-6">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                relative border-2 border-dashed rounded-2xl p-12 text-center transition-colors
                ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
              `}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Camera className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-medium text-foreground mb-1">
                    Point camera at landmark
                  </p>
                  <p className="text-sm text-muted-foreground">or drag and drop an image here</p>
                </div>
                <Button variant="outline" className="mt-2 bg-transparent">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Photo
                </Button>
              </div>
            </div>

            {/* Demo Button */}
            <div className="mt-6 text-center">
              <Button
                variant="secondary"
                onClick={() => {
                  setUploadedImage(mockAnalysis.imageUrl);
                  analyzeImage();
                }}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Try Demo Image
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Analysis Results */
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Image Preview */}
          <Card className="overflow-hidden">
            <div className="relative">
              <img
                src={uploadedImage || "/placeholder.svg"}
                alt="Uploaded landmark"
                className="w-full h-64 lg:h-96 object-cover"
                crossOrigin="anonymous"
              />
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-4 right-4"
                onClick={resetUpload}
              >
                <X className="w-4 h-4" />
              </Button>

              {isAnalyzing && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
                  <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                  <p className="text-lg font-medium text-foreground">Analyzing landmark...</p>
                  <p className="text-sm text-muted-foreground">This may take a moment</p>
                </div>
              )}
            </div>
          </Card>

          {analysisResult && (
            <>
              {/* Landmark Name & Location */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-2xl lg:text-3xl text-foreground">
                    {analysisResult.name}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {analysisResult.location}, {analysisResult.country}
                    </span>
                  </div>
                </CardHeader>
              </Card>

              {/* Info Sections */}
              <div className="grid gap-4 lg:grid-cols-2">
                {/* Historical Facts */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Landmark className="w-4 h-4 text-primary" />
                      </div>
                      <CardTitle className="text-lg text-foreground">Historical Facts</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2">
                      {analysisResult.historicalFacts.map((fact, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                          {fact}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Interesting Details */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                        <Star className="w-4 h-4 text-accent" />
                      </div>
                      <CardTitle className="text-lg text-foreground">Interesting Details</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2">
                      {analysisResult.interestingDetails.map((detail, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Travel Tips */}
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-chart-3/10 flex items-center justify-center">
                        <Lightbulb className="w-4 h-4 text-chart-3" />
                      </div>
                      <CardTitle className="text-lg text-foreground">Travel Tips</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="grid gap-2 lg:grid-cols-2">
                      {analysisResult.travelTips.map((tip, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-chart-3 mt-2 shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 justify-center">
                <Button className="flex-1 sm:flex-none">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat about this
                </Button>
                <Button variant="outline" className="flex-1 sm:flex-none bg-transparent">
                  <Bookmark className="w-4 h-4 mr-2" />
                  Save to history
                </Button>
                <Button variant="outline" className="flex-1 sm:flex-none bg-transparent">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
