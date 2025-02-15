import AboutContent from "./about.mdx";
import MyComponent from "../components/MyComponent";

export default function About() {
  return (
    <div className="prose mx-auto p-6">
      <AboutContent components={{ MyComponent }} />
    </div>
  );
}
