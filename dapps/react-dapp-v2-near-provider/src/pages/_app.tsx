import "../styles/globals.css";
import type { AppProps } from "next/app";
import { createGlobalStyle } from "styled-components";
import { ClientContextProvider } from "../contexts/ClientContext";
import Metadata from "../components/Metadata";

import { globalStyle } from "./../styles";
const GlobalStyle = createGlobalStyle`
  ${globalStyle}
`;

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Metadata />
      <GlobalStyle />
      <ClientContextProvider>
        <Component {...pageProps} />
      </ClientContextProvider>
    </>
  );
}

export default MyApp;
