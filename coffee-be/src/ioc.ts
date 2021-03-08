import { IocContainerFactory } from "tsoa";
import { Container } from "typescript-ioc";

// const iocContainer = Container

// export { iocContainer };


const iocContainer: IocContainerFactory = (
    request: Request
  ) => {
    const container = Container;
  //   container.bind(request);
    return container;
  };

  // export according to convention
  export { iocContainer };
