import axios from 'axios';

import { _getProducts, _createProduct, _deleteProduct } from './actionCreators';
import { _getOrders, _updateOrder, _removeOrders } from './actionCreators';
import { _createReview, _deleteReview, _getProductReviews, _editReview } from './actionCreators';
import { _setAuth, _logOut } from './actionCreators';
import { _getCategories } from './actionCreators';

import { authHeader, getLocalCart, findLocalLineItem } from './utils';


//PRODUCTS
export const getProducts = () => {
  return (dispatch) => {
    return axios.get('/api/products')
      .then(response => response.data)
      .then(products => dispatch(_getProducts(products)))
      .catch(error => console.log(error.message))
  }
}

export const createProduct = (product) => {
  return (dispatch) => {
    axios.post('/api/products', product)
      .then(response => dispatch(_createProduct(response.data)))
      .catch(err => console.log(err.message))
  }
}

export const deleteProduct = (product) => {
  return (dispatch) => {
    axios.delete(`/api/products/${product.id}`, authHeader())
      .then(response => dispatch(_deleteProduct(response.data)))
      .catch(err => console.log(err.message))
  }
}

//ORDERS
export const getOrders = () => {
  return (dispatch, getState) => {
    const { user } = getState().auth;
    axios.get(`/api/users/${user.id}/orders`, authHeader())
      .then(response => response.data)
      .then(orders => dispatch(_getOrders(orders)))
      .catch(err => console.log(err.message))
  }
}

export const updateOrder = (order) => {

  return (dispatch, getState) => {
    const { user } = getState().auth;
    return axios.put(`/api/users/${user.id}/orders/${order.id}`, { status: 'ORDER' }, authHeader())
      .then(() => {
        return dispatch(getOrders())
          .catch(err => console.log(err.message))
      })
      .catch(err => console.log(err.message))
  }
}

/* Removed this from updateOrder to be DRY and instead calls the getOrders thunk
   axios.get(`/api/users/${user.id}/orders`, authHeader()) // after updating the order, load all of the user's orders again to normalize data
           .then(response => response.data)
           .then(orders => dispatch(_getOrders(orders)))

*/

export const submitOrder = (order, transactionData) => {
  return dispatch => {
    return axios.post('/api/payment/charge', transactionData)
      .then( response => response.data)
      .then( status => status )
      .catch(err => console.log(err))
  }
}

export const guestSubmit = (cart, transactionData) => {
  return async dispatch => {
    try {
      const order = await axios.post('/api/guest/lineItems', cart)
      const response = await axios.post('/api/payment/charge', {...transactionData, cartId: order.data.id})
      return { status: response.data.status, order: order.data }
    } catch(err){
      console.log(err)
    }
  } 
}


//LINE ITEMS
export const createLineItem = (cart, product) => {
  return (dispatch, getState) => {
    const { user } = getState().auth;
    return axios.post(`/api/users/${user.id}/orders/${cart.id}/lineitems`, { productId: product.id, quantity: 1 }, authHeader())
      .then(() => {
        axios.get(`/api/users/${user.id}/orders`, authHeader())
          .then(response => response.data)
          .then(orders => dispatch(_getOrders(orders)))
      })
  }
}

export const incrementLineItem = (cart, lineItem) => {
  return (dispatch, getState) => {
    const { user } = getState().auth;
    return axios.put(`/api/users/${user.id}/orders/${cart.id}/lineitems/${lineItem.id}`, { quantity: ++lineItem.quantity }, authHeader())
      .then(() => {
        axios.get(`/api/users/${user.id}/orders`, authHeader())
          .then(response => response.data)
          .then(orders => dispatch(_getOrders(orders)))
      })
  }
}

export const deleteLineItem = (cart, lineItem) => {
  return (dispatch, getState) => {
    const { user } = getState().auth;
    return axios.delete(`/api/users/${user.id}/orders/${cart.id}/lineitems/${lineItem.id}`, authHeader())
      .then(() => {
        return axios.get(`/api/users/${user.id}/orders`, authHeader())
          .then(response => response.data)
          .then(orders => dispatch(_getOrders(orders)))
          .catch(err => console.log(err))
      })
  }
}

export const decrementLineItem = (cart, lineItem) => {
  return (dispatch, getState) => {
    const { user } = getState().auth;
    return axios.put(`/api/users/${user.id}/orders/${cart.id}/lineItems/${lineItem.id}`, { quantity: --lineItem.quantity }, authHeader())
      .then(() => {
        axios.get(`/api/users/${user.id}/orders`, authHeader())
          .then(response => response.data)
          .then(orders => dispatch(_getOrders(orders)))
      })
  }
}

//REVIEWS
export const getProductReviews = (productId) => {
  return (dispatch) => {
    return axios.get(`/api/reviews/${productId}`)
      .then(response => response.data)
      .then(reviews => dispatch(_getProductReviews(reviews)))
      .catch(error => console.log(error.message))
  }
}

export const createReview = (id, review) => {
  return (dispatch, getState) => {
    const { user } = getState().auth;
    return axios.post(`/api/reviews/${user.id}/${id}`, review, authHeader())
      .then(response => response.data)
      .then(review => dispatch(_createReview(review)))
      .catch(error => console.log(error.message))
  }
}

export const deleteReview = (productId, reviewId) => {
  return (dispatch, getState) => {
    const { user } = getState().auth;
    return axios.delete(`/api/reviews/${user.id}/${productId}/${reviewId}`, authHeader())
      .then(() => dispatch(_deleteReview(reviewId)))
      .catch(error => console.log(error.message))
  }
}

export const editReview = (id, review) => {
  return (dispatch, getState) => {
    const { user } = getState().auth
    return axios.put(`/api/reviews/${user.id}/${id}`, review, authHeader())
      .then(response => response.data)
      .then(review => dispatch(_editReview(review)))
      .catch(error => console.log(error.message))
  }
}

//AUTH
export const exchangeTokenForAuth = history => {
  return dispatch => {
    const token = window.localStorage.getItem('token')
    if (!token) {
      return;
    }
    return axios.get('/api/auth', {
      headers: {
        authorization: token
      }
    })
      .then(response => response.data)
      .then(auth => {
        dispatch(_setAuth(auth))
      })
      .then(() => {
        dispatch(getOrders())
        if (history) {
          history.push('/products');
        }
      })
      .catch(ex => {
        console.log(ex);
        window.localStorage.removeItem('token');
      })
  }
}
export const logIn = (credentials, history) => {
  return async dispatch => {
    //console.log(credentials)
    const response = await axios.post('/api/auth/', credentials)
    window.localStorage.setItem('token', response.data.token)
    return dispatch(exchangeTokenForAuth(history))
  }
}
export const logOut = history => {
  return dispatch => {
    window.localStorage.removeItem('token')
    dispatch(_logOut())
    dispatch(_removeOrders())
    history.push('/home')
  }
}

export const signUp = (userInfo, history) => {
  return dispatch => {
    return axios.post('/api/auth/create', userInfo)
      .then(user => {
        const { email, password } = user.data
        dispatch(logIn({ email, password }, history))
      })
      .catch((err) => console.log(err))
  }
}
// CATEGORIES
export const getCategories = () => {
  return (dispatch) => {
    axios.get('/api/categories')
      .then(response => dispatch(_getCategories(response.data)))
      .catch(err => console.log(err.message))
  }
}
