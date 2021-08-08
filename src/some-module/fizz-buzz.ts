function fizzBuzz(num: number) {

  function isDivisibleBy(divisor: number) {
    return ( num: number ) => ( num % divisor ) === 0 
  }

  const isDivisibleBy3 = isDivisibleBy(3)
  const isDivisibleBy5 = isDivisibleBy(5)


  if ( isDivisibleBy3( num ) ) {
    if ( isDivisibleBy5( num ) )
      return "FizzBuzz"
    return "Fizz"
  } 
  else if ( isDivisibleBy5( num ) )
    return "Buzz"

  return 'nothing'
}

export interface IO {
  out( output: string ): void,
  in( message: string ): number
}

export default class FizzBuzz {
  private device: IO

  constructor( device: IO ) {
    this.device = device
  }

  fizzBuzzquear(): void {

    const from = this.device.in ( '"from" what you start?' )
                 this.device.out( `You choice "from": ${ from }\n` )

    const to   = this.device.in ( 'and "to" you finish?')
                 this.device.out( `You choice "to": ${ to }` )

                 this.device.out( 'OK...\n' )

    let result = ''
    for( let state = from; state < to; state++ ) {
      let stateFormated = ( state < 10 )? ` ${ state }` : `${ state }`
      result += `${ stateFormated } -> ${ fizzBuzz( state ) } \n`
    }

    this.device.out( 'The result of fizzBuzzquear is:' )
    this.device.out( result )
  }
}