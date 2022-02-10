import type { NextPage } from "next";
import Head from "next/head";
import Home from "../views/Home";

const Index: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>png-bonding-example</title>
      </Head>
      <Home />
    </div>
  );
};

export default Index;
