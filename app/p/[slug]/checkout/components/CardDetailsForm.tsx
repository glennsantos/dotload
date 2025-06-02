interface CardDetailsFormProps {
  cardName: string;
  setCardName: (value: string) => void;
  cardNumber: string;
  setCardNumber: (value: string) => void;
  cardExpiry: string;
  setCardExpiry: (value: string) => void;
  cardCvc: string;
  setCardCvc: (value: string) => void;
}

export default function CardDetailsForm({
  cardName,
  setCardName,
  cardNumber,
  setCardNumber,
  cardExpiry,
  setCardExpiry,
  cardCvc,
  setCardCvc
}: CardDetailsFormProps) {
  return (
    <div>
      <h2 className="text-lg font-light text-gray-900 mb-4">Card Details</h2>
      <div className="space-y-4 mb-6">
        <div>
          <label htmlFor="cardName" className="block text-sm font-light text-gray-700 mb-1">
            Name on card
          </label>
          <input
            type="text"
            id="cardName"
            name="cardName"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="John Doe"
            required
          />
        </div>
        <div>
          <label htmlFor="cardNumber" className="block text-sm font-light text-gray-700 mb-1">
            Card number
          </label>
          <input
            type="text"
            id="cardNumber"
            name="cardNumber"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="4111 1111 1111 1111"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="cardExpiry" className="block text-sm font-light text-gray-700 mb-1">
              Expiration date (MM/YY)
            </label>
            <input
              type="text"
              id="cardExpiry"
              name="cardExpiry"
              value={cardExpiry}
              onChange={(e) => setCardExpiry(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="MM/YY"
              required
            />
          </div>
          <div>
            <label htmlFor="cardCvc" className="block text-sm font-light text-gray-700 mb-1">
              CVC
            </label>
            <input
              type="text"
              id="cardCvc"
              name="cardCvc"
              value={cardCvc}
              onChange={(e) => setCardCvc(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="123"
              required
            />
          </div>
        </div>
      </div>
    </div>
  );
}
