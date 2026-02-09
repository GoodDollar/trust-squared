import { Button } from "@/components/ui/button";
import { DynamicConnectButton } from "@dynamic-labs/sdk-react-core";
import { injected } from "@wagmi/connectors";
import { useConnect } from "wagmi";


export default function Login() {
  const { connect } = useConnect();

  let isMiniPlay = false;
  if (window && window.ethereum) {
    

   
  

if (window.ethereum && 'isMiniPay' in window.ethereum) {

  if (window.ethereum.isMiniPay) {
    isMiniPlay = true;
  }
}
  }

  const onConnectMiniPay = () => {
    try {
      connect({
        connector: injected(),
      });
    } catch (error) {
      console.error("Error connecting:", error);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
     <div className="text-center space-y-6 mb-8">
        {/* Logo Section */}
        <div className="text-center space-y-8 mb-8">
        
           <img src="/logo2.svg" alt="logo" className="w-44 block mx-auto" />
          
          
          {/* Subtitle */}
          <p className="text-gray-400 text-sm leading-relaxed px-4">
            Build your reputation through trust
            <br />
            and contributions.
          </p>
        </div>

        {/* Sign In Button */}
        <div className="w-full">
          {isMiniPlay ? (
            <Button 
              onClick={onConnectMiniPay}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors"
            >
              Sign in
            </Button>
          ) : (
            <DynamicConnectButton 
              buttonClassName="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              Sign in
            </DynamicConnectButton>
          )}
        </div>
      </div>
    </div>
  );
}