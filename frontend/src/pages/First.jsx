import React from "react";
import CardHolder from "../components/CardHolder";
import Apropos from "../components/Apropos";
import Footer from "../components/footer";



function First() {
  return (
  <div className="flex-grow flex-col flex items-center justify-center">
<CardHolder/>
<div id="apropos">
<Apropos/>
</div>
<Footer type="public" />
  </div>
  );
}

export default First;
